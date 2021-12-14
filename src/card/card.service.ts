import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import { In, Like, Not, Repository } from "typeorm";
import { Queue } from "bull";

import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";

import { DeckService } from "@deck/deck.service";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { CardUsage } from "@card/models/card-usage.object";
import { CardSuggestion } from "@card/models/card-suggestion.object";
import { BanListDeclaration } from "@card/models/banlist-declaration.object";

import { downloadFileFromUrl } from "@utils/net";

import { pubSub } from "@root/pubsub";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class CardService implements OnModuleInit {
    private banLists: { [key: string]: BanListDeclaration } = {};

    public constructor(
        @Inject(forwardRef(() => DeckService)) private readonly deckService: DeckService,
        @InjectQueue("card-update") private readonly cardUpdateQueue: Queue,
        @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
        @InjectRepository(Text) private readonly textRepository: Repository<Text>,
    ) {}

    public async onModuleInit() {
        await this.cardUpdateQueue.add("update");

        const banListFilePath = path.join(process.cwd(), "lflist.conf");
        await downloadFileFromUrl("https://raw.githubusercontent.com/Fluorohydride/ygopro/master/lflist.conf", banListFilePath);

        const fileContent = await fs.readFile(banListFilePath).then(buffer => buffer.toString());
        const lines = fileContent.replace(/\r\n/g, "\n").split("\n");
        const banListTitle = lines[0];
        const banListItems = banListTitle
            .replace(/[#\[]/g, "")
            .split("]")
            .filter(item => Boolean(item));
        for (const banListItem of banListItems) {
            this.banLists[banListItem] = new BanListDeclaration();
        }

        let currentBanListTitle = "";
        for (const line of lines) {
            if (line.startsWith("!")) {
                currentBanListTitle = line.trim().replace("!", "");
                continue;
            }

            if (line.startsWith("#")) {
                continue;
            }

            if (!/^[0-9]/.test(line)) {
                continue;
            }

            const [content] = line.split("--");
            const [cardId, maxCardCount] = content
                .trim()
                .split(" ")
                .map(token => parseInt(token, 10));

            switch (maxCardCount) {
                case 0:
                    if (!this.banLists[currentBanListTitle].forbidden) {
                        this.banLists[currentBanListTitle].forbidden = [];
                    }

                    this.banLists[currentBanListTitle].forbidden.push(cardId);
                    break;

                case 1:
                    if (!this.banLists[currentBanListTitle].limit) {
                        this.banLists[currentBanListTitle].limit = [];
                    }

                    this.banLists[currentBanListTitle].limit.push(cardId);
                    break;

                case 2:
                    if (!this.banLists[currentBanListTitle].semiLimit) {
                        this.banLists[currentBanListTitle].semiLimit = [];
                    }

                    this.banLists[currentBanListTitle].semiLimit.push(cardId);
                    break;
            }
        }
    }
    public async count() {
        return this.cardRepository.count();
    }

    public async findByIds(ids: (string | number)[]) {
        const cards = _.chain(await this.cardRepository.findByIds(ids))
            .keyBy("id")
            .mapValues()
            .value();

        return ids.map(id => cards[id]);
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
    public async findAll(ids?: number[] | null | undefined) {
        return this.cardRepository.find({
            where: ids ? { id: In(ids) } : undefined,
            order: {
                id: "ASC",
            },
        });
    }

    public async suggestCards(query: string, count: number) {
        const resultCards = await this.cardRepository.find({
            where: {
                text: {
                    name: Like(`%${query}%`),
                },
            },
            take: count,
            relations: ["text"],
        });

        return resultCards.map(card => {
            const cardSuggestion = new CardSuggestion();
            cardSuggestion.card = card;
            cardSuggestion.id = card.id;
            cardSuggestion.name = card.text.name;

            return cardSuggestion;
        });
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

    @Cron("0 0 * * * *")
    public async doUpdate() {
        await this.cardUpdateQueue.add("update");
    }

    public getAvailableBanLists() {
        return _.chain(this.banLists)
            .keys()
            .orderBy(title => parseInt(title.split(".")[1]))
            .orderBy(title => parseInt(title.split(".")[0]))
            .reverse()
            .value();
    }
    public getBanList(title: string) {
        if (!(title in this.banLists)) {
            throw new Error(`Given banlist with title \`${title}\` doesn't exist.`);
        }

        return this.banLists[title];
    }
}
