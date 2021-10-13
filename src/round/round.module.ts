import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PlayerModule } from "@player/player.module";
import { DeckModule } from "@deck/deck.module";

import { RoundResolver } from "@round/round.resolver";
import { PlayerDeckResolver } from "@round/player-deck.resolver";
import { RoundService } from "@round/round.service";

import Round from "@round/models/round.model";
import PlayerDeck from "@round/models/player-deck.model";

@Module({
    imports: [TypeOrmModule.forFeature([Round, PlayerDeck]), PlayerModule, DeckModule],
    providers: [RoundResolver, RoundService, PlayerDeckResolver],
    exports: [RoundService],
})
export class RoundModule {}
