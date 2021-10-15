import { Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";

import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";

import Deck from "@deck/models/deck.model";

const PREDEFINED_DECK_TAGS = Object.entries({
    사이버류: ["사이버드래곤", "사이버다크"],
});

@Injectable()
export class DeckService {
    public constructor(
        @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
        @Inject(CardService) private readonly cardService: CardService,
    ) {}

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
                for (const [deckName, tags] of PREDEFINED_DECK_TAGS) {
                    const notMatched = tags.some(tag => deck.recognizedDeckTags.indexOf(tag) === -1);
                    if (notMatched) {
                        break;
                    }

                    let foundAt: number | null = null;
                    data.deckTag = data.deckTag
                        .map((t, i) => {
                            const found = tags.indexOf(t) >= 0;
                            if (!foundAt && found) {
                                foundAt = i;
                                return deckName;
                            } else if (found) {
                                return "";
                            }

                            return t;
                        })
                        .filter(t => Boolean(t));
                }

                deck.recognizedName = data.deckTag.reverse().join("");
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
}
