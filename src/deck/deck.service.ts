import * as _ from "lodash";
import { In, Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";
import { Queue } from "bull";

import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";

import { CardService } from "@card/card.service";

import { MatchResultData, MatchService } from "@match/match.service";

import Deck from "@deck/models/deck.model";
import { WinRateData } from "@deck/models/win-rate.model";
import Match from "@match/models/match.model";
import Player from "@player/models/player.model";

const PREDEFINED_DECK_TAGS = Object.entries({
    사이버류: ["사이버드래곤", "사이버다크"],
    괴수카구야: ["미계역", "카구야", "설화"],
});

const DECK_TAG_WEIGHTS = {
    제외계: -10,
    드라그마: -9,
    용사: -8,
};

@Injectable()
export class DeckService implements OnModuleInit {
    private readonly logger = new Logger(DeckService.name);

    public constructor(
        @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
        @InjectRepository(WinRateData) private readonly winRateDataRepository: Repository<WinRateData>,
        @InjectQueue("win-rate") private readonly winRateQueue: Queue,
        @Inject(CardService) private readonly cardService: CardService,
        @Inject(MatchService) private readonly matchService: MatchService,
    ) {}

    public async onModuleInit() {
        const decks = await this.deckRepository
            .createQueryBuilder()
            .select("id")
            .addSelect("recognizedDeckTags")
            .where("CHAR_LENGTH(recognizedDeckTags) > 0")
            .andWhere("recognizedDeckTags LIKE '%,%'")
            .getRawMany<{ id: number; recognizedDeckTags: string }>();

        const grouped = _.groupBy(decks, p => p.recognizedDeckTags) as { [key: string]: typeof decks };
        for (const [tags, decks] of Object.entries(grouped)) {
            const targetIds = decks.map(d => d.id);

            const deck = this.deckRepository.create();
            deck.recognizedDeckTags = tags.split(",");

            this.reorderDeckTag(deck);
            this.renameDeck(deck);

            if (!deck.recognizedName) {
                continue;
            }

            await this.deckRepository.update({ id: In(targetIds) }, { recognizedName: deck.recognizedName });
        }

        const winRateDataCount = await this.winRateDataRepository.count();
        if (!winRateDataCount) {
            await this.winRateQueue.add("migrate");
        }
    }

    public async create(main: number[], side: number[]) {
        const mainCards = await this.cardService.findByIds(main);
        const deck = this.deckRepository.create();
        deck.mainIds = mainCards.filter(c => !c.isExtraCard).map(c => c.id);
        deck.extraIds = mainCards.filter(c => c.isExtraCard).map(c => c.id);
        deck.sideIds = side;

        try {
            const identifierBaseUrl = process.env.IDENTIFIER_URL || "http://localhost:3003";
            const formData = new FormData();
            formData.append("deck", [...deck.mainIds, ...deck.extraIds, "!side", ...deck.sideIds].join("\n"));

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

    private generateDeckUsageObject(res: { name: string; count: string; tags: string }[]) {
        return res.map(item => ({
            name: item.name,
            tags: !item.tags ? [] : item.tags.split(","),
            count: parseInt(item.count, 10),
            key: `${item.name}|${item.tags}`,
        }));
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
            .groupBy("`wrd`.`deckName`")
            .addGroupBy("`wrd`.`deckTags`")
            .orderBy("`count`", "DESC");

        if (won) {
            queryBuilder = queryBuilder.where("`wrd`.`won` = 1");
        }

        return queryBuilder.getRawMany<{ name: string; count: string; tags: string }>().then(this.generateDeckUsageObject);
    }
    public async getWinRates(count: number): Promise<[string, number][]> {
        const usageData = await this.getDeckUsages();
        const winningData = await this.getDeckUsages(true);
        const winningMap = _.chain(winningData).keyBy("key").mapValues("count").value();

        const topUsages = usageData.slice(0, count);
        const restUsages = usageData.slice(count);
        const results: [string, number, number][] = [];
        for (const item of topUsages) {
            const result: [string, number, number] = [item.name, item.count, winningMap[item.key]];
            const otherUsages = restUsages.filter(data => data.tags.indexOf(item.name) >= 0);
            for (const usingDeck of otherUsages) {
                result[1] += usingDeck.count;
                result[2] += winningMap[usingDeck.key] || 0;
            }

            results.push(result);
        }

        return _.chain(results)
            .map<[string, number]>(item => [item[0], item[2] / item[1]])
            .sortBy(p => p[1])
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
}
