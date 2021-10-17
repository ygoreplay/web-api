import * as fs from "fs-extra";
import fetch from "node-fetch";
import { createConnection, Repository } from "typeorm";

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Octokit } from "@octokit/rest";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { YGOProCard } from "@card/models/Card.sqlite";

@Injectable()
export class CardService implements OnModuleInit {
    private readonly logger = new Logger(CardService.name);
    private readonly octokit = new Octokit({
        auth: "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",
    });

    public constructor(
        @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
        @InjectRepository(Text) private readonly textRepository: Repository<Text>,
    ) {}

    public async onModuleInit() {
        await this.doUpdate();
    }

    public async findByIds(ids: (string | number)[]) {
        const cards = await this.cardRepository.findByIds(ids);
        return ids.map(id => {
            const card = cards.find(c => c.id.toString() === id.toString());
            if (!card) {
                throw new Error(`Failed to find a card with id: ${id}`);
            }

            return card;
        });
    }
    public async findById(id: Card["id"]) {
        return this.cardRepository.findOne({
            where: {
                id,
            },
        });
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

        return [savedCommitId !== commits.data[0].sha, fs.existsSync("./cards.cdb")];
    }

    private async doUpdate() {
        this.logger.log("Check if there's new card database...");

        const [updateNeeded, databaseExists] = await this.checkIfUpdateNeeded();
        if (!updateNeeded && !databaseExists) {
            this.logger.log("Card database currently installed seems up to date.");
            return;
        }

        const commits = await this.octokit.repos.listCommits({
            owner: "mycard",
            repo: "ygopro-database",
        });

        if (!databaseExists) {
            this.logger.log("Card database currently installed seems outdated.");
            this.logger.log("try to download and apply new one...");

            const buffer = await fetch("https://github.com/mycard/ygopro-database/raw/master/locales/ko-KR/cards.cdb").then(res => res.buffer());
            await fs.writeFile("cards.cdb", buffer);
        } else if (databaseExists) {
            this.logger.log("Card database currently downloaded but not inserted.");
            this.logger.log("try to insert all into database ...");
        }

        const connection = await createConnection({
            type: "sqlite",
            database: "cards.cdb",
            entities: [YGOProCard, Text],
            name: "sqlite",
        });

        await this.cardRepository.delete({});
        await this.textRepository.delete({});

        const allTexts = await connection.getRepository<Text>(Text).find();
        await this.textRepository.save(
            allTexts.map(t => {
                const result = this.textRepository.create();
                result.id = t.id;
                result.name = t.name;
                result.desc = t.desc;
                result.str1 = t.str1;
                result.str2 = t.str2;
                result.str3 = t.str3;
                result.str4 = t.str4;
                result.str5 = t.str5;
                result.str6 = t.str6;
                result.str7 = t.str7;
                result.str8 = t.str8;
                result.str9 = t.str9;
                result.str10 = t.str10;
                result.str11 = t.str11;
                result.str12 = t.str12;
                result.str13 = t.str13;
                result.str14 = t.str14;
                result.str15 = t.str15;
                result.str16 = t.str16;

                return t;
            }),
        );

        const localTexts = await this.textRepository.find();
        const allCards = await connection.getRepository<YGOProCard>(YGOProCard).find();
        await this.cardRepository.save(
            allCards.map(c => {
                const result = this.cardRepository.create();
                result.id = c.id;
                result.ot = c.ot;
                result.alias = c.alias;
                result._setcode = c._setcode;
                result.type = c.type;
                result.atk = c.atk;
                result.def = c.def;
                result.level = c.level;
                result.race = c.race;
                result.attribute = c.attribute;
                result.category = c.category;
                result.text = localTexts.find(t => t.id === c.text.id);

                return result;
            }),
        );

        await connection.close();
        await fs.writeFile(".db-last-commit", commits.data[0].sha);
    }
}
