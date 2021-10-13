import { Inject } from "@nestjs/common";
import { ResolveField, Resolver, Root } from "@nestjs/graphql";

import { RoundService } from "@round/round.service";

import Round from "@round/models/round.model";
import PlayerDeck from "@round/models/player-deck.model";

@Resolver(() => Round)
export class RoundResolver {
    public constructor(@Inject(RoundService) private readonly roundService: RoundService) {}

    @ResolveField(() => [PlayerDeck])
    public async playerDecks(@Root() round: Round) {
        return this.roundService.getPlayerDecks(round);
    }
}
