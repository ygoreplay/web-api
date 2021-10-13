import { Inject } from "@nestjs/common";
import { ResolveField, Resolver, Root } from "@nestjs/graphql";

import PlayerDeck from "@round/models/player-deck.model";
import Player from "@player/models/player.model";

import { PlayerService } from "@player/player.service";
import { DeckService } from "@deck/deck.service";
import Deck from "@deck/models/deck.model";

@Resolver(() => PlayerDeck)
export class PlayerDeckResolver {
    public constructor(@Inject(PlayerService) private readonly playerService: PlayerService, @Inject(DeckService) private readonly deckService: DeckService) {}

    @ResolveField(() => Player)
    public async player(@Root() playerDeck: PlayerDeck) {
        return this.playerService.findById(playerDeck.playerId);
    }

    @ResolveField(() => Deck)
    public async deck(@Root() playerDeck: PlayerDeck) {
        return this.deckService.findById(playerDeck.deckId);
    }
}
