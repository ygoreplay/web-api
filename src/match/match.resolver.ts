import { Inject } from "@nestjs/common";
import { Args, Int, Query, Resolver } from "@nestjs/graphql";

import { MatchService } from "@match/match.service";

import Match from "@match/models/match.model";

@Resolver(() => Match)
export class MatchResolver {
    public constructor(@Inject(MatchService) private readonly matchService: MatchService) {}

    @Query(() => [Match])
    public async matches(@Args("count", { type: () => Int }) count: number, @Args("after", { type: () => Int, nullable: true }) after?: Match["id"]) {
        return this.matchService.find(count, after);
    }
}
