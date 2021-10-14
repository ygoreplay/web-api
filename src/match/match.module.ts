import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RoundModule } from "@round/round.module";
import { PlayerModule } from "@player/player.module";

import { MatchService } from "@match/match.service";
import { MatchResolver } from "@match/match.resolver";

import Match from "@match/models/match.model";

@Module({
    imports: [TypeOrmModule.forFeature([Match]), RoundModule, PlayerModule],
    providers: [MatchService, MatchResolver],
    exports: [MatchService],
})
export class MatchModule {}
