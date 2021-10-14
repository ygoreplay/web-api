import { Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";

import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";

import Deck from "@deck/models/deck.model";

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

            const data: { deck: string; tag: string[] } = await fetch(`${identifierBaseUrl}/production/recognize`, {
                method: "POST",
                body: formData,
            }).then(res => res.json());

            deck.recognizedName = data.deck;
        } catch {
            deck.recognizedName = "unknown deck";
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
