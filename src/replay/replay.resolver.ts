import { Query, Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { ReplayService } from "@replay/replay.service";

import Match from "@replay/models/match.model";

@Resolver(() => Match)
export class ReplayResolver {
    public constructor(@Inject(ReplayService) private readonly replayService: ReplayService) {}

    @Query(() => [Match])
    public async matches() {
        return this.replayService.find();
    }
}
