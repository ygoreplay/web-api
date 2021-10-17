import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DeckResolver } from "@deck/deck.resolver";
import { DeckService } from "@deck/deck.service";
import Deck from "@deck/models/deck.model";

import { CardModule } from "@card/card.module";
import { MatchModule } from "@match/match.module";

@Module({
    imports: [TypeOrmModule.forFeature([Deck]), CardModule, forwardRef(() => MatchModule)],
    providers: [DeckResolver, DeckService],
    exports: [DeckService],
})
export class DeckModule {}
