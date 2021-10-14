import { Inject } from "@nestjs/common";
import { Args, Int, Query, ResolveField, Resolver, Root, Subscription } from "@nestjs/graphql";

import { MatchService } from "@match/match.service";
import Match from "@match/models/match.model";

import { RoundService } from "@round/round.service";
import Round from "@round/models/round.model";

import { PlayerService } from "@player/player.service";
import Player from "@player/models/player.model";

import { pubSub } from "@root/pubsub";

@Resolver(() => Match)
export class MatchResolver {
    public constructor(
        @Inject(MatchService) private readonly matchService: MatchService,
        @Inject(RoundService) private readonly roundService: RoundService,
        @Inject(PlayerService) private readonly playerService: PlayerService,
    ) {}

    @Query(() => [Match])
    public async matches(@Args("count", { type: () => Int }) count: number, @Args("after", { type: () => Int, nullable: true }) after?: Match["id"]) {
        return this.matchService.find(count, after);
    }

    @Query(() => Int)
    public async matchCount() {
        return this.matchService.count();
    }

    @ResolveField(() => Player, { nullable: true })
    public async winner(@Root() match: Match) {
        if (!match.winnerId) {
            return null;
        }

        return this.playerService.findById(match.winnerId);
    }

    @ResolveField(() => [Round])
    public async rounds(@Root() match: Match) {
        return this.roundService.findByIds(match.roundIds);
    }

    @Subscription(() => Match)
    public async newMatchCreated() {
        return pubSub.asyncIterator("newMatchCreated");
    }

    @Subscription(() => Int)
    public async matchCountUpdated() {
        return pubSub.asyncIterator("matchCountUpdated");
    }
}
