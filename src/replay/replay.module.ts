import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ReplayService } from "@replay/replay.service";
import { ReplayController } from "@replay/replay.controller";
import { ReplayResolver } from "@replay/replay.resolver";

import MatchRule from "@replay/models/match-rule.model";
import PlayerDeck from "@round/models/player-deck.model";

import { MatchModule } from "@match/match.module";
import { RoundModule } from "@round/round.module";
import { DeckModule } from "@deck/deck.module";
import { PlayerModule } from "@player/player.module";

@Module({
    imports: [TypeOrmModule.forFeature([MatchRule, PlayerDeck]), MatchModule, RoundModule, DeckModule, PlayerModule],
    providers: [ReplayService, ReplayResolver],
    controllers: [ReplayController],
})
export class ReplayModule {}
