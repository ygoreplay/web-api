import { Inject } from "@nestjs/common";
import { Args, Int, Query, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { MatchService } from "@match/match.service";

import Match from "@match/models/match.model";
import Round from "@round/models/round.model";
import { RoundService } from "@round/round.service";

@Resolver(() => Match)
export class MatchResolver {
    public constructor(@Inject(MatchService) private readonly matchService: MatchService, @Inject(RoundService) private readonly roundService: RoundService) {}

    @Query(() => [Match])
    public async matches(@Args("count", { type: () => Int }) count: number, @Args("after", { type: () => Int, nullable: true }) after?: Match["id"]) {
        return this.matchService.find(count, after);
    }

    @ResolveField(() => [Round])
    public async rounds(@Root() match: Match) {
        return this.roundService.findByIds(match.roundIds);
    }
}
