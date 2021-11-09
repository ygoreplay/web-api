import * as _ from "lodash";
import * as fs from "fs-extra";
import fetch from "node-fetch";
import { createConnection, Not, Repository } from "typeorm";

import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Octokit } from "@octokit/rest";

import { DeckService } from "@deck/deck.service";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { YGOProCard } from "@card/models/Card.sqlite";
import { CardUsage } from "@card/models/card-usage.object";
import { pubSub } from "@root/pubsub";

@Injectable()
export class CardService implements OnModuleInit {
    private readonly logger = new Logger(CardService.name);
    private readonly octokit = new Octokit({
        auth: "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",
    });

    public constructor(
        @Inject(forwardRef(() => DeckService)) private readonly deckService: DeckService,
        @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
        @InjectRepository(Text) private readonly textRepository: Repository<Text>,
    ) {}

    public async onModuleInit() {
        await this.doUpdate();
    }

    public async count() {
        return this.cardRepository.count();
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
    public async findByIndex(index: number): Promise<Card | undefined> {
        const data = await this.cardRepository.find({
            order: {
                id: "ASC",
            },
            skip: index,
            take: 1,
        });

        return data[0];
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
    private async doUpdate() {
        this.logger.log("Check if there's new card database...");

        const [updateNeeded, databaseExistsButNotInstalled] = await this.checkIfUpdateNeeded();
        if (!updateNeeded && !databaseExistsButNotInstalled) {
            this.logger.log("Card database currently installed seems up to date.");
            return;
        }

        const commits = await this.octokit.repos.listCommits({
            owner: "mycard",
            repo: "ygopro-database",
        });

        if (!databaseExistsButNotInstalled) {
            this.logger.log("Card database currently installed seems outdated.");
            this.logger.log("try to download and apply new one...");

            const buffer = await fetch("https://github.com/mycard/ygopro-database/raw/master/locales/ko-KR/cards.cdb").then(res => res.buffer());
            await fs.writeFile("cards.cdb", buffer);
        } else if (databaseExistsButNotInstalled) {
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

    public async getTopUsageCards(count: number) {
        const allDecks = await this.deckService.getAllDecks();
        const allAliasedCard = _.chain(
            await this.cardRepository.find({
                where: {
                    alias: Not(0),
                },
            }),
        )
            .keyBy("id")
            .mapValues("alias")
            .value();

        const cardUsage = _.chain(allDecks)
            .map(d => [...d.main, ...d.extra, ...d.side])
            .flattenDeep()
            .countBy(p => allAliasedCard[p] || p)
            .entries()
            .map<[number, number]>(p => [parseInt(p[0], 10), p[1]])
            .orderBy(p => p[1])
            .reverse()
            .slice(0, count)
            .value();

        const topCardIds = cardUsage.map(p => p[0]);
        const cards = await this.cardRepository.findByIds(topCardIds);

        return cardUsage.map<CardUsage>(p => {
            const cardUsage = new CardUsage();
            cardUsage.card = cards.find(c => c.id === p[0]);
            cardUsage.count = p[1];

            return cardUsage;
        });
    }
    public async noticeTopUsageCardsUpdated() {
        const topUsageCards = await this.getTopUsageCards(10);
        await pubSub.publish("cardUsageListUpdated", {
            cardUsageListUpdated: topUsageCards,
        });
    }
}
