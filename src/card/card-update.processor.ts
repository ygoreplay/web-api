import * as _ from "lodash";
import * as fs from "fs-extra";
import { createConnection, Repository } from "typeorm";
import * as path from "path";
import { nanoid } from "nanoid";

import { Octokit } from "@octokit/rest";

import { Inject, Logger } from "@nestjs/common";
import { OnQueueError, Process, Processor } from "@nestjs/bull";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { YGOProCard } from "@card/models/Card.sqlite";
import { Text } from "@card/models/Text.model";
import { Card } from "@card/models/Card.model";
import { downloadFileFromUrl } from "@root/utils/net";
import { isEntityUpdated, replaceEntity } from "@root/utils/cards";

@Processor("card-update")
export class CardUpdateProcessor {
    private readonly octokit = new Octokit({
        auth: "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",
    });

    private readonly logger = new Logger(CardUpdateProcessor.name);

    public constructor(
        @Inject(CardService) private readonly cardService: CardService,
        @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
        @InjectRepository(Text) private readonly textRepository: Repository<Text>,
    ) {}

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

        if (process.env.NODE_ENV === "production") {
            const commits = await this.octokit.repos.listCommits({
                owner: "mycard",
                repo: "ygopro-database",
            });

            await fs.writeFile(".db-last-commit", commits.data[0].sha);
        }

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
        await this.updateCardDatabase();
    }

    @OnQueueError()
    public async onError(error: Error) {
        return console.error(error);
    }
}
