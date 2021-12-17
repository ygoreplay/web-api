import * as _ from "lodash";
import * as fs from "fs-extra";
import { createConnection, Repository } from "typeorm";
import * as path from "path";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import * as AdmZip from "adm-zip";
import * as glob from "fast-glob";

import { Octokit } from "@octokit/rest";

import { Inject, Logger } from "@nestjs/common";
import { OnGlobalQueueError, Process, Processor } from "@nestjs/bull";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { YGOProCard } from "@card/models/Card.sqlite";
import { Text } from "@card/models/Text.model";
import { Card } from "@card/models/Card.model";
import { EdoCard } from "@card/models/edo-card.model";

import { downloadFileFromUrl } from "@utils/net";
import { isEntityUpdated, replaceEntity } from "@utils/cards";
import { EdoText } from "@card/models/edo-text.model";

const EDOPRO_CARD_DATABASE_PATH = path.join(process.cwd(), "./edo");

@Processor("card-update")
export class CardUpdateProcessor {
    private static async readCardsFromDatabase(databasePath: string): Promise<YGOProCard[]> {
        const connection = await createConnection({
            type: "sqlite",
            database: databasePath,
            entities: [YGOProCard, Text],
            name: "edo",
        });

        const repository = connection.getRepository(YGOProCard);
        const allCards = await repository.find({
            relations: ["text"],
        });

        await connection.close();

        return allCards;
    }

    private readonly octokit = new Octokit({
        auth: "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",
    });

    private readonly logger = new Logger(CardUpdateProcessor.name);

    public constructor(
        @Inject(CardService) private readonly cardService: CardService,
        @InjectRepository(EdoCard) private readonly edoCardRepository: Repository<EdoCard>,
        @InjectRepository(EdoText) private readonly edoTextRepository: Repository<EdoText>,
        @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
        @InjectRepository(Text) private readonly textRepository: Repository<Text>,
    ) {}

    private async checkIfEdoProCardUpdateNeeded() {
        if (!fs.existsSync(".edo-db-last-commit")) {
            return true;
        }

        const savedCommitId = await fs.readFile(".edo-db-last-commit").then(b => b.toString());
        const commits = await this.octokit.repos.listCommits({
            owner: "JSY1728",
            repo: "EDOPRO-Korean-CDB-TEST",
        });

        return savedCommitId !== commits.data[0].sha;
    }
    private async updateEdoProCardDatabase() {
        if (fs.existsSync(EDOPRO_CARD_DATABASE_PATH)) {
            fs.rmSync(EDOPRO_CARD_DATABASE_PATH, { force: true, recursive: true });
        }

        await fs.ensureDir(EDOPRO_CARD_DATABASE_PATH);

        const updateNeeded = await this.checkIfEdoProCardUpdateNeeded();
        if (!updateNeeded) {
            return false;
        }

        this.logger.debug("Found updates for EDOPro card database, now we apply it into our server...");
        await this.edoCardRepository.delete({});
        await this.edoTextRepository.delete({});

        const archiveBuffer = await fetch("https://github.com/JSY1728/EDOPRO-Korean-CDB-TEST/archive/refs/heads/master.zip").then(res => res.buffer());
        const zip = new AdmZip(archiveBuffer);
        const entries = zip.getEntries();
        let index = 0;
        for (const entry of entries) {
            if (!entry.entryName.endsWith(".cdb")) {
                continue;
            }

            const databaseBuffer = entry.getData();
            await fs.writeFile(path.join(EDOPRO_CARD_DATABASE_PATH, `./${index.toString().padStart(2, "0")}.cdb`), databaseBuffer);

            index++;
        }

        const edoCardDatabasePath = await glob("./edo/*.cdb");
        let allCards: YGOProCard[] = [];
        for (const databasePath of edoCardDatabasePath) {
            const cards = await CardUpdateProcessor.readCardsFromDatabase(databasePath);
            allCards.push(...cards);
        }

        allCards = _.uniqBy(allCards, c => c.id);
        const originalCards = await this.cardService.findAll();
        const originalCardMap = _.chain(originalCards)
            .keyBy(c => c.id)
            .mapValues()
            .value();
        const missingCards = allCards.filter(c => !originalCardMap[c.id] && Boolean(c.text?.name));

        const addedCards = missingCards.map(c => {
            const entity = this.edoCardRepository.create();
            entity.id = c.id;
            replaceEntity(entity, c);

            return entity;
        });
        const addedTexts = missingCards.map(c => {
            const entity = this.edoTextRepository.create();
            entity.id = c.id;
            replaceEntity(entity, c.text);

            return entity;
        });

        const chunks = _.chunk(addedCards, 300);
        const textChunks = _.chunk(addedTexts, 300);
        let processed = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const textChunk = textChunks[i];

            await this.edoTextRepository.createQueryBuilder().insert().values(textChunk).execute();
            await this.edoCardRepository.createQueryBuilder().insert().values(chunk).execute();

            processed += chunk.length;

            if (i % 4 === 0) {
                if (chunks.length - 1 === i) {
                    break;
                }

                this.logger.debug(`Installing EDOPro cards... (${processed}/${addedCards.length}) [${((processed / addedCards.length) * 100).toFixed(0)}%]`);
            }
        }

        this.logger.debug(`Installing EDOPro cards... (${processed}/${addedCards.length}) [${((processed / addedCards.length) * 100).toFixed(0)}%]`);
        this.logger.debug("Successfully installed EDOPro cards.");

        const commits = await this.octokit.repos.listCommits({
            owner: "JSY1728",
            repo: "EDOPRO-Korean-CDB-TEST",
        });

        await fs.writeFile(".edo-db-last-commit", commits.data[0].sha);
    }

    private async updateEntities(repository: Repository<YGOProCard | Text>) {
        const newEntities = await repository.find();
        const oldEntities = await this.cardRepository.find();
        const oldEntityMap = _.chain(oldEntities).keyBy("id").mapValues().value();
        const oldRepository: Repository<Text | Card> = "name" in newEntities[0] ? this.textRepository : this.cardRepository;

        const added = _.differenceBy(newEntities, oldEntities, c => c.id).map(target => {
            const entity = oldRepository.create();
            entity.id = target.id;
            replaceEntity(entity, target);

            return entity;
        });
        if (added.length > 0) {
            const chunks = _.chunk(added, 300);
            for (const chunk of chunks) {
                await oldRepository.createQueryBuilder().insert().values(chunk).execute();
            }
        }

        const deletedCards = _.differenceBy(oldEntities, newEntities, c => c.id);
        if (deletedCards.length > 0) {
            await oldRepository
                .createQueryBuilder("c")
                .delete()
                .where("`c`.`id` IN (:ids)", { ids: deletedCards.map(c => c.id) })
                .execute();
        }

        const updated = _.xorBy(newEntities, added, c => c.id).filter(c => isEntityUpdated(oldEntityMap[c.id], c));
        const updatedCards: Card[] = [];
        for (const entity of updated) {
            const target = oldEntityMap[entity.id];
            replaceEntity(target, entity);

            updatedCards.push(target);
        }

        await oldRepository.save(updatedCards);

        const updateTarget = "name" in newEntities[0] ? "text" : "card";
        this.logger.debug(`Succeeded to update ${updateTarget}s.`);
        this.logger.debug(`Added: ${added.length}, Deleted: ${deletedCards.length}, Updated: ${updatedCards.length}`);
    }

    private async checkIfUpdateNeeded() {
        if (!fs.existsSync(".db-last-commit")) {
            return [true, false];
        }

        const savedCommitId = await fs.readFile(".db-last-commit").then(b => b.toString());
        const commits = await this.octokit.repos.listCommits({
            owner: "mycard",
            repo: "ygopro-database",
        });

        return [savedCommitId !== commits.data[0].sha, fs.existsSync("./cards.cdb") && (await this.cardRepository.count()) === 0];
    }
    private async updateCardDatabase() {
        this.logger.debug("Check if there's new card database...");

        const [updateNeeded, databaseExistsButNotInstalled] = await this.checkIfUpdateNeeded();
        if (!updateNeeded && !databaseExistsButNotInstalled) {
            this.logger.debug("Card database currently installed seems up to date.");
            return;
        }

        const commits = await this.octokit.repos.listCommits({
            owner: "mycard",
            repo: "ygopro-database",
        });

        await fs.writeFile(".db-last-commit", commits.data[0].sha);

        let cdbFilePath: string | null = null;
        if (!databaseExistsButNotInstalled) {
            this.logger.debug("Card database currently installed seems outdated.");
            this.logger.debug("Try to download and apply new one...");

            cdbFilePath = await downloadFileFromUrl("https://cdn02.moecube.com/ygopro-database/ko-KR/cards.cdb", path.join(process.cwd(), `${nanoid()}.cdb`));

            this.logger.debug("Succeeded to download newer card database file.");
            this.logger.debug("Try to replace all into database ...");
        } else if (databaseExistsButNotInstalled) {
            this.logger.debug("Card database currently downloaded but not inserted.");
            this.logger.debug("try to insert all into database ...");
        }

        const connection = await createConnection({
            type: "sqlite",
            database: cdbFilePath,
            entities: [YGOProCard, Text],
            name: "sqlite",
        });

        try {
            await this.updateEntities(connection.getRepository(Text));
            await this.updateEntities(connection.getRepository(YGOProCard));
        } catch (e) {
            this.logger.error("Failed to update cards: ");
            console.error(e);
        }

        await connection.close();
        await fs.unlink(cdbFilePath);

        this.logger.debug("Succeeded to update card database.");
    }

    @Process("update")
    public async doUpdate() {
        try {
            await this.updateCardDatabase();
            await this.updateEdoProCardDatabase();
        } catch (e) {
            console.log(e);
        }
    }

    @OnGlobalQueueError()
    public async onError(error: Error) {
        return console.error(error);
    }
}
