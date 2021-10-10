import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DeckResolver } from "@deck/deck.resolver";
import { DeckService } from "@deck/deck.service";

import Deck from "@deck/models/deck.model";

@Module({
    imports: [TypeOrmModule.forFeature([Deck])],
    providers: [DeckResolver, DeckService],
    exports: [DeckService],
})
export class DeckModule {}
