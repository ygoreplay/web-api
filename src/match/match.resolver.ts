import { Inject } from "@nestjs/common";
import { Args, Int, Query, ResolveField, Resolver, Root, Subscription } from "@nestjs/graphql";

import { MatchService } from "@match/match.service";
import Match from "@match/models/match.model";

import { RoundService } from "@round/round.service";
import Round from "@round/models/round.model";

import { pubSub } from "@root/pubsub";

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

    @Subscription(() => Match)
    public async newMatchCreated() {
        return pubSub.asyncIterator("newMatchCreated");
    }
}
