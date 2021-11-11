import * as moment from "moment";
import * as _ from "lodash";
import { In, Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";
import { Cron } from "@nestjs/schedule";

import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";

import { MatchResultData, MatchService } from "@match/match.service";
import Match from "@match/models/match.model";

import Player from "@player/models/player.model";

import Deck from "@deck/models/deck.model";
import { DeckUsage } from "@deck/models/deck-usage.object";
import { DeckType } from "@deck/models/deck-type.object";
import { DeckTitleCard } from "@deck/models/deck-title-card.model";
import { DeckTitleCardInput } from "@deck/models/deck-title-card.input";
import { WinRateData } from "@deck/models/win-rate.model";

const PREDEFINED_DECK_TAGS = Object.entries({
    사이버류: ["사이버드래곤", "사이버다크"],
    괴수카구야: ["미계역", "카구야", "설화"],
});

const DECK_TAG_WEIGHTS = {
    제외계: -10,
    드라그마: -9,
    용사: -8,
};

const USAGE_BLACKLIST: string[] = ["용사"];

interface UsageData {
    name: string;
    count: number;
}

@Injectable()
export class DeckService {
    private readonly logger = new Logger(DeckService.name);

    public constructor(
        @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
        @InjectRepository(WinRateData) private readonly winRateDataRepository: Repository<WinRateData>,
        @InjectRepository(DeckTitleCard) private readonly deckTitleCardRepository: Repository<DeckTitleCard>,
        @Inject(forwardRef(() => CardService)) private readonly cardService: CardService,
        @Inject(forwardRef(() => MatchService)) private readonly matchService: MatchService,
    ) {}

    public async create(main: number[], side: number[]) {
        const mainCards = await this.cardService.findByIds(main);
        const deck = this.deckRepository.create();
        deck.mainIds = mainCards.filter(c => !c.isExtraCard).map(c => c.id);
        deck.extraIds = mainCards.filter(c => c.isExtraCard).map(c => c.id);
        deck.sideIds = side;

        try {
            const identifierBaseUrl = process.env.IDENTIFIER_URL || "http://localhost:3006";
            const formData = new FormData();
            formData.append("deck", [...deck.mainIds, "#extra", ...deck.extraIds, "!side", ...deck.sideIds].join("\n"));

            const data: { deck: string; tag?: string[]; deckTag?: string[] } = await fetch(`${identifierBaseUrl}/production/recognize`, {
                method: "POST",
                body: formData,
            }).then(res => res.json());

            deck.recognizedName = data.deck;
            deck.recognizedTags = data.tag ? data.tag.filter(p => Boolean(p.trim())) : [];
            deck.recognizedDeckTags = data.deckTag ? data.deckTag.filter(p => Boolean(p.trim())) : [];
            if (data.deckTag && data.deckTag.length > 0) {
                deck.recognizedName = data.deckTag.reverse().join("");

                this.reorderDeckTag(deck);
                this.renameDeck(deck);
            }
        } catch (e) {
            console.log((e as Error).message);

            deck.recognizedName = "unknown deck";
            deck.recognizedTags = [];
            deck.recognizedDeckTags = [];
        }

        return this.deckRepository.save(deck);
    }

    public findById(deckId: Deck["id"]) {
        return this.deckRepository.findOne({
            where: {
                id: deckId,
            },
        });
    }

    public async getWinRates(count: number): Promise<[string, number][]> {
        const usageData = (await this.getDeckUsages()).slice(0, count);
        const winningData = await this.getDeckUsages(true);

        const result: [string, number][] = [];
        for (const item of usageData) {
            const winningItem = winningData.find(i => i.name === item.name);
            if (!winningItem) {
                throw new Error(`Failed to find winning data of deck: ${item.name}`);
            }

            result.push([item.name, winningItem.count / item.count]);
        }

        return _.chain(result)
            .orderBy(p => p[1])
            .reverse()
            .value();
    }
    public async registerWinRateData(match: Match) {
        const matchResult = await this.matchService.getMatchResultData(match);
        const winRateData = this.composeMatchResultToWinRate(matchResult);

        await this.winRateDataRepository.insert(winRateData);
    }
    public composeMatchResultToWinRate(matchResult: MatchResultData[]): WinRateData[] {
        return matchResult.map<WinRateData>(data => {
            const winRateData = this.winRateDataRepository.create();
            winRateData.deckName = data.deckName;
            winRateData.createdAt = data.matchStartedAt;
            winRateData.won = data.won;
            winRateData.player = {
                id: data.playerId,
            } as Player;
            winRateData.match = {
                id: data.matchId,
            } as Match;
            winRateData.deckTags = data.deckTags;

            return winRateData;
        });
    }
    private async getDeckUsages(won?: boolean) {
        // SELECT
        //     `deckName`,
        //     `deckTags`,
        //     COUNT(`deckName`) AS `count`
        // FROM
        //     `win-rate-data` `w-r-d`
        // GROUP BY
        //     `deckName`,
        //     `deckTags`
        // ORDER BY
        //     `count` DESC
        let queryBuilder = await this.winRateDataRepository
            .createQueryBuilder("wrd")
            .select("`wrd`.`deckName`", "name")
            .addSelect("`wrd`.`deckTags`", "tags")
            .addSelect("COUNT(`wrd`.`deckName`)", "count")
            .innerJoin("matches", "m", "`m`.`id` = `wrd`.`matchId`")
            .where("`m`.`type` = 'athletic'")
            .groupBy("`wrd`.`deckName`")
            .addGroupBy("`wrd`.`deckTags`")
            .orderBy("`count`", "DESC");

        if (won) {
            queryBuilder = queryBuilder.where("`wrd`.`won` = 1");
        }

        const data = await queryBuilder.getRawMany<{ name: string; count: string; tags: string }>();
        const results: { [deckName: string]: UsageData } = {};
        for (const item of data) {
            if (!item.tags) {
                if (!results[item.name]) {
                    results[item.name] = {
                        name: item.name,
                        count: 0,
                    };
                }

                results[item.name].count += parseInt(item.count, 10);
                continue;
            }

            const deckTags = item.tags.split(",");
            for (const tag of deckTags) {
                if (!results[tag]) {
                    results[tag] = {
                        name: tag,
                        count: 0,
                    };
                }

                results[tag].count += parseInt(item.count, 10);
            }
        }

        return _.chain(results)
            .values()
            .orderBy(p => p.count)
            .reverse()
            .filter(p => USAGE_BLACKLIST.indexOf(p.name) < 0)
            .value();
    }

    private renameDeck(deck: Deck) {
        let tags = [...deck.recognizedDeckTags];
        const mostMatchedDeckTag = _.chain(PREDEFINED_DECK_TAGS)
            .filter(t => _.intersection(tags, t[1]).length === t[1].length)
            .sortBy(t => t[1].length)
            .first()
            .value() as [string, string[]];

        if (!mostMatchedDeckTag) {
            return false;
        }

        tags = [mostMatchedDeckTag[0], ..._.difference(tags, mostMatchedDeckTag[1])];
        deck.recognizedName = tags.reverse().join("");

        return true;
    }
    private reorderDeckTag(deck: Deck) {
        const ordered = _.sortBy(deck.recognizedDeckTags, t => (t in DECK_TAG_WEIGHTS ? DECK_TAG_WEIGHTS[t] : 0));
        const result = !_.isEqual(deck.recognizedDeckTags, ordered);
        if (result) {
            deck.recognizedName = ordered.join("");
        }

        return result;
    }

    public async getAllDecks() {
        const date = moment().startOf("minute").subtract(5, "minutes");

        return this.deckRepository
            .createQueryBuilder("d")
            .select("`d`.`main`", "main")
            .addSelect("`d`.`extra`", "extra")
            .addSelect("`d`.`side`", "side")
            .where("`d`.`createdAt` > :date", { date: date.format("YYYY-MM-DD HH:mm:ss") })
            .getRawMany<{ main: string; extra: string; side: string }>()
            .then(rows =>
                rows.map(row => ({
                    main: row.main.split(",").map(p => parseInt(p, 10)),
                    extra: row.extra.split(",").map(p => parseInt(p, 10)),
                    side: row.extra.split(",").map(p => parseInt(p, 10)),
                })),
            );
    }
    public async getTopUsageDecks(count: number): Promise<DeckUsage[]> {
        const date = moment().startOf("minute").subtract(30, "minutes");
        const data = await this.deckRepository
            .createQueryBuilder("d")
            .select("`d`.`recognizedName`", "name")
            .addSelect("`d`.`recognizedDeckTags`", "tags")
            .addSelect("COUNT(`d`.`recognizedName`)", "count")
            .where("`d`.`createdAt` > :date", { date: date.format("YYYY-MM-DD HH:mm:ss") })
            .groupBy("`d`.`recognizedName`")
            .addGroupBy("`d`.`recognizedDeckTags`")
            .getRawMany<{ name: string; tags: string; count: string }>()
            .then(rows => rows.map(row => ({ name: row.name, tags: row.tags.split(",").filter(s => Boolean(s)), count: parseInt(row.count, 10) })));

        const items = _.chain(data)
            .keyBy("name")
            .mapValues(d => d)
            .value();

        for (const item of data) {
            for (const tag of item.tags) {
                if (!(tag in items)) {
                    continue;
                }

                items[tag].count += item.count;
            }
        }

        return _.chain(items)
            .values()
            .filter(p => p.tags.length === 0)
            .sortBy(p => p.count)
            .reverse()
            .filter(p => USAGE_BLACKLIST.indexOf(p.name) === -1)
            .slice(0, count)
            .map(p => ({ deckName: p.name, count: p.count }))
            .value();
    }

    public async getAllTitleCards() {
        return this.deckTitleCardRepository.find();
    }
    public async registerDeckTitleCards(input: DeckTitleCardInput[]) {
        const targetDeckNames = input.map(item => item.deckName);
        const originalDeckTitleCards = await this.deckTitleCardRepository.find({
            where: {
                name: In(targetDeckNames),
            },
        });

        const cards = await this.cardService.findByIds(input.map(item => item.cardId));
        const deckTitleCards = input.map(item => {
            const targetCard = cards.find(card => card.id === item.cardId);
            if (!targetCard) {
                throw new Error(`Failed to find card with id: ${item.cardId}`);
            }

            const original = originalDeckTitleCards.find(dtc => dtc.name === item.deckName);
            if (original) {
                original.card = targetCard;
                return original;
            }

            const deckTitleCard = this.deckTitleCardRepository.create();
            deckTitleCard.card = targetCard;
            deckTitleCard.name = item.deckName;

            return deckTitleCard;
        });

        return this.deckTitleCardRepository.save(deckTitleCards);
    }

    public async getDeckTypes() {
        const items = await this.deckRepository
            .createQueryBuilder("d")
            .select("`d`.`recognizedName`", "name")
            .addSelect("MAX(`d`.`id`)", "id")
            .addSelect("COUNT(`d`.`recognizedName`)", "count")
            .groupBy("`name`")
            .orderBy("`count`", "DESC")
            .getRawMany<{ name: string; id: string; count: string }>()
            .then(rows => rows.map(row => ({ name: row.name, id: parseInt(row.id, 10), count: parseInt(row.count, 10) })));

        return items.map(item => {
            const deckType = new DeckType();
            deckType.id = item.id;
            deckType.name = item.name;

            return deckType;
        });
    }

    @Cron("0 */5 * * * *")
    private async pollIdentifierUpdate() {
        const identifierBaseUrl = process.env.IDENTIFIER_URL || "http://localhost:3006";

        await fetch(`${identifierBaseUrl}/update`, {
            method: "POST",
        }).then(res => res.text());

        this.logger.debug("Successfully sent identifier update checking message.");
    }
}
