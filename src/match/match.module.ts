import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MatchService } from "@match/match.service";
import { MatchResolver } from "@match/match.resolver";

import Match from "@match/models/match.model";

@Module({
    imports: [TypeOrmModule.forFeature([Match])],
    providers: [MatchService, MatchResolver],
    exports: [MatchService],
})
export class MatchModule {}
