import { Repository } from "typeorm";
import fetch from "node-fetch";
import * as FormData from "form-data";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Deck from "@deck/models/deck.model";

@Injectable()
export class DeckService {
    public constructor(@InjectRepository(Deck) private readonly deckRepository: Repository<Deck>) {}

    public async create(main: number[], side: number[]) {
        const deck = this.deckRepository.create();
        deck.main = main;
        deck.side = side;

        const identifierBaseUrl = process.env.IDENTIFIER_URL || "http://localhost:3003";
        const formData = new FormData();
        formData.append("deck", [...deck.main, "!side", ...deck.side].join("\n"));

        const data: { deck: string; tag: string[] } = await fetch(`${identifierBaseUrl}/production/recognize`, {
            method: "POST",
            body: formData,
        }).then(res => res.json());

        deck.recognizedName = data.deck;
        return this.deckRepository.save(deck);
    }
}
