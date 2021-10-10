import { Module } from "@nestjs/common";

import { MatchService } from "@match/match.service";
import { MatchResolver } from "@match/match.resolver";

@Module({
    providers: [MatchService, MatchResolver],
    exports: [MatchService],
})
export class MatchModule {}
