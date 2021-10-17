import * as _ from "lodash";
import { Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";

import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";

import Deck from "@deck/models/deck.model";
import { MatchService } from "@match/match.service";

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
        @Inject(CardService) private readonly cardService: CardService,
        @Inject(MatchService) private readonly matchService: MatchService,
    ) {}

    public async onModuleInit() {
        const decks = await this.deckRepository.createQueryBuilder("d").where("CHAR_LENGTH(`recognizedDeckTags`) > 0").getMany();
        const multiTagDecks = decks.filter(d => d.recognizedDeckTags.length > 1);

        const changedDeck: Deck[] = [];
        for (const deck of multiTagDecks) {
            const needToSave = this.reorderDeckTag(deck) || this.renameDeck(deck);
            if (!needToSave) {
                continue;
            }

            changedDeck.push(deck);
        }

        await this.deckRepository.save(changedDeck);
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
