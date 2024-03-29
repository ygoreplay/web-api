import { Inject } from "@nestjs/common";
import { Args, Int, Query, ResolveField, Resolver, Root, Subscription } from "@nestjs/graphql";

import { MatchService } from "@match/match.service";
import Match from "@match/models/match.model";

import { RoundService } from "@round/round.service";
import Round from "@round/models/round.model";
import PlayerDeck from "@round/models/player-deck.model";

import { PlayerService } from "@player/player.service";
import Player from "@player/models/player.model";

import { MatchRuleService } from "@match-rule/match-rule.service";
import MatchRule from "@match-rule/models/match-rule.model";

import { pubSub } from "@root/pubsub";
import { MatchFilter } from "@match/models/match-filter.object";

@Resolver(() => Match)
export class MatchResolver {
    public constructor(
        @Inject(MatchService) private readonly matchService: MatchService,
        @Inject(RoundService) private readonly roundService: RoundService,
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @Inject(MatchRuleService) private readonly matchRuleService: MatchRuleService,
    ) {}

    @Query(() => Match, { nullable: true })
    public async match(@Args("id", { type: () => Int }) id: Match["id"]) {
        return this.matchService.findById(id);
    }

    @Query(() => [Match])
    public async matches(
        @Args("count", { type: () => Int }) count: number,
        @Args("after", { type: () => Int, nullable: true }) after?: Match["id"],
        @Args("filter", { type: () => MatchFilter, nullable: true }) filter?: MatchFilter,
    ) {
        return this.matchService.find(count, after, filter);
    }

    @Query(() => Int)
    public async matchCount() {
        return this.matchService.count();
    }

    @ResolveField(() => PlayerDeck)
    public async home(@Root() match: Match) {
        const rounds = await this.rounds(match);
        const players = await this.players(match);
        const playerDecks = await this.roundService.getPlayerDecks(rounds[0]);

        return playerDecks.find(pd => pd.playerId === players[0].id);
    }

    @ResolveField(() => PlayerDeck)
    public async away(@Root() match: Match) {
        const rounds = await this.rounds(match);
        const players = await this.players(match);
        const playerDecks = await this.roundService.getPlayerDecks(rounds[0]);

        return playerDecks.find(pd => pd.playerId === players[1].id);
    }

    @ResolveField(() => [Player])
    public async players(@Root() match: Match) {
        return this.playerService.findByIds(match.playerIds);
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

    @ResolveField(() => Int)
    public async roundCount(@Root() match: Match) {
        return match.roundIds.length;
    }

    @ResolveField(() => MatchRule)
    public async matchRule(@Root() match: Match) {
        return this.matchRuleService.findById(match.matchRuleId);
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
