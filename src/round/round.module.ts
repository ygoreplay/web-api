import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RoundResolver } from "@round/round.resolver";
import { RoundService } from "@round/round.service";

import Round from "@round/models/round.model";
import PlayerDeck from "@round/models/player-deck.model";

@Module({
    imports: [TypeOrmModule.forFeature([Round, PlayerDeck])],
    providers: [RoundResolver, RoundService],
    exports: [RoundService],
})
export class RoundModule {}
