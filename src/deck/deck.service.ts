import { Repository } from "typeorm";

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

        return this.deckRepository.save(deck);
    }
}
