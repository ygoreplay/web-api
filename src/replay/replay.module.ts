import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ReplayService } from "@replay/replay.service";
import { ReplayController } from "@replay/replay.controller";
import { ReplayResolver } from "@replay/replay.resolver";

import Player from "@replay/models/player.model";
import Round from "@replay/models/round.model";
import Deck from "@replay/models/deck.model";
import MatchRule from "@replay/models/match-rule.model";
import PlayerDeck from "@replay/models/player-deck.model";
import Match from "@replay/models/match.model";

@Module({
    imports: [TypeOrmModule.forFeature([MatchRule, Match, Round, Player, Deck, PlayerDeck])],
    providers: [ReplayService, ReplayResolver],
    controllers: [ReplayController],
})
export class ReplayModule {}
