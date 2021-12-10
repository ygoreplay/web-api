import * as moment from "moment";
import * as _ from "lodash";
import { In, Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";
import { createCanvas, Image, loadImage } from "canvas";
import { v4 as generateUUID } from "uuid";

import { Cron } from "@nestjs/schedule";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { StorageService } from "@storage/storage.service";

import { MatchResultData, MatchService } from "@match/match.service";
import Match from "@match/models/match.model";

import Player from "@player/models/player.model";

import Deck from "@deck/models/deck.model";
import { DeckUsage } from "@deck/models/deck-usage.object";
import { DeckType } from "@deck/models/deck-type.object";
import { DeckTitleCard } from "@deck/models/deck-title-card.model";
import { DeckTitleCardInput } from "@deck/models/deck-title-card.input";
import { WinRateData } from "@deck/models/win-rate.model";
import { WinRate } from "@deck/models/win-rate.object";

const PREDEFINED_DECK_TAGS = Object.entries({
    사이버류: ["사이버드래곤", "사이버다크"],
    괴수카구야: ["미계역", "카구야", "설화"],
    엔디미온: ["마법족의마을", "마력카운터"],
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
        @Inject(forwardRef(() => StorageService)) private readonly storageService: StorageService,
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

    public async getWinRates(count: number) {
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

        const data = _.chain(result)
            .orderBy(p => p[1])
            .reverse()
            .value();

        const targetCards = await this.deckTitleCardRepository.find({
            where: {
                name: In(data.map(item => item[0])),
            },
            relations: ["card"],
        });

        const targetCardMap = _.chain(targetCards).keyBy("name").mapValues("card").value();

        return data.map<WinRate>(p => ({ rate: p[1], deckName: p[0], titleCard: targetCardMap[p[0]] }));
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
            .addSelect("`d-t-c`.`cardId`", "cardId")
            .leftJoin("deck-title-card", "d-t-c", "`d-t-c`.`name` = `d`.`recognizedName`")
            .where("`d`.`createdAt` > :date", { date: date.format("YYYY-MM-DD HH:mm:ss") })
            .groupBy("`d`.`recognizedName`")
            .addGroupBy("`d`.`recognizedDeckTags`")
            .addGroupBy("`d-t-c`.`cardId`")
            .getRawMany<{ name: string; tags: string; count: string; cardId: string | null }>()
            .then(rows =>
                rows.map(row => ({
                    name: row.name,
                    tags: row.tags.split(",").filter(s => Boolean(s)),
                    count: parseInt(row.count, 10),
                    cardId: row.cardId ? parseInt(row.cardId, 10) : null,
                })),
            );

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

        const result = _.chain(items)
            .values()
            .filter(p => p.tags.length === 0)
            .sortBy(p => p.count)
            .reverse()
            .filter(p => USAGE_BLACKLIST.indexOf(p.name) === -1)
            .slice(0, count)
            .map(p => ({ deckName: p.name, count: p.count, cardId: p.cardId }))
            .value();

        const targetCards = await this.cardService.findByIds(result.map(item => item.cardId));
        const targetCardMap = _.chain(targetCards).keyBy("id").mapValues().value();

        return result.map(item => {
            const deckUsage = new DeckUsage();
            deckUsage.deckName = item.deckName;
            deckUsage.count = item.count;
            deckUsage.titleCard = targetCardMap[item.cardId];

            return deckUsage;
        });
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
    public async getTitleCard(recognizedName: string) {
        return this.deckTitleCardRepository.findOne({
            where: {
                name: recognizedName,
            },
        });
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

    public async getUsedCards(deckName: string) {
        const decks = await this.deckRepository
            .createQueryBuilder("d")
            .select("`d`.`recognizedName`", "name")
            .addSelect("`d`.`main`", "main")
            .addSelect("`d`.`extra`", "extra")
            .where("`d`.`recognizedName` = :deckName", { deckName })
            .skip(0)
            .take(250)
            .orderBy("`d`.`id`", "DESC")
            .getRawMany<{ name: string; main: string; extra: string }>()
            .then(rows => rows.map(row => ({ cardIds: [...row.main.split(","), ...row.extra.split(",")].map(id => parseInt(id, 10)) })));

        const allCardIds = _.chain(decks).map("cardIds").flatten().uniq().value();
        return this.cardService.findByIds(allCardIds);
    }

    public async generateDeckRecipeImage(mainDeck: number[], extraDeck: number[], sideDeck: number[]) {
        const deckImageFrame = await this.storageService.download("deck-image-frame-title.png", "static");
        const deckImageCopyright = await this.storageService.download("deck-image-copyright.png", "static");
        if (!Buffer.isBuffer(deckImageFrame) || !Buffer.isBuffer(deckImageCopyright)) {
            throw new Error("Failed to download deck image frame!");
        }

        const frameTitleImage = await loadImage(deckImageFrame);
        const frameCopyrightImage = await loadImage(deckImageCopyright);
        const cardIds = _.chain(mainDeck).concat(extraDeck).concat(sideDeck).uniq().value();
        const cardImages = await Promise.all(cardIds.map(cardId => this.storageService.download(`card-image/${cardId}.jpg`, "static")));
        const cardImageMap: { [cardId: string]: Image } = {};
        for (let i = 0; i < cardIds.length; i++) {
            const cardId = cardIds[i];
            const cardImage = cardImages[i];
            if (!Buffer.isBuffer(cardImage)) {
                continue;
            }

            cardImageMap[cardId] = await loadImage(cardImage);
        }

        const desiredHeight =
            82 + // Header
            56 * 3 + // Titles
            180 * Math.max(4, Math.ceil(mainDeck.length / 10)) + // Main
            180 * Math.max(2, Math.ceil(extraDeck.length / 10)) + // Extra
            180 * Math.max(2, Math.ceil(sideDeck.length / 10)) + // Side
            frameCopyrightImage.height; // Copyright
        const canvas = createCanvas(frameTitleImage.width, desiredHeight);

        const context = canvas.getContext("2d");
        let currentY = 0;
        const renderCards = (cardList: number[], startY: number, minRows: number) => {
            for (let i = 0; i < cardList.length; i++) {
                const cardId = cardList[i];
                context.drawImage(cardImageMap[cardId], (i % 10) * 124, startY + Math.floor(i / 10) * 180, 124, 180);
            }

            currentY += 180 * Math.max(minRows, Math.ceil(cardList.length / 10));
        };

        context.fillStyle = "#000000";
        context.fillRect(0, 0, frameTitleImage.width, desiredHeight);

        context.fillStyle = "#012233";
        context.fillRect(0, 0, frameTitleImage.width, (currentY += 82));

        context.drawImage(frameTitleImage, 0, currentY, frameTitleImage.width, frameTitleImage.height);
        currentY += frameTitleImage.height;
        renderCards(mainDeck, currentY, 4);

        context.drawImage(frameTitleImage, 0, currentY, frameTitleImage.width, frameTitleImage.height);
        currentY += frameTitleImage.height;
        renderCards(extraDeck, currentY, 2);

        context.drawImage(frameTitleImage, 0, currentY, frameTitleImage.width, frameTitleImage.height);
        currentY += frameTitleImage.height;
        renderCards(sideDeck, currentY, 2);

        context.drawImage(frameCopyrightImage, 0, currentY, frameCopyrightImage.width, frameCopyrightImage.height);

        const deckImageBuffer = canvas.toBuffer("image/png", {
            compressionLevel: 9,
        });
        const uuid = generateUUID();

        await this.storageService.ensureBucket("deck-images");
        const object = await this.storageService.upload(deckImageBuffer, `${uuid}.png`, "deck-images");

        return object.Location;
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
