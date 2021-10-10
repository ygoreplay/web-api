import { Resolver } from "@nestjs/graphql";
import { Inject } from "@nestjs/common";

import { ReplayService } from "@replay/replay.service";

import Match from "@match/models/match.model";

@Resolver(() => Match)
export class ReplayResolver {
    public constructor(@Inject(ReplayService) private readonly replayService: ReplayService) {}
}
