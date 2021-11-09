import { Inject } from "@nestjs/common";
import { Args, Int, Query, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

import { DeckService } from "@deck/deck.service";
import Deck from "@deck/models/deck.model";
import { WinRate } from "@deck/models/win-rate.object";
import { DeckUsage } from "@deck/models/deck-usage.object";

@Resolver(() => Deck)
export class DeckResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService, @Inject(DeckService) private readonly deckService: DeckService) {}

    @Query(() => [DeckUsage])
    public async topUsageDecks(@Args("count", { type: () => Int }) count: number) {
        return this.deckService.getTopUsageDecks(count);
    }

    @Query(() => [WinRate])
    public async winRate(@Args("count", { type: () => Int, defaultValue: 10 }) count: number) {
        const winRate = await this.deckService.getWinRates(count);
        return winRate.map<WinRate>(p => ({ rate: p[1], deckName: p[0] }));
    }

    @ResolveField(() => [Card])
    public async main(@Root() deck: Deck) {
        return this.cardService.findByIds(deck.mainIds);
    }

    @ResolveField(() => [Card])
    public async extra(@Root() deck: Deck) {
        return this.cardService.findByIds(deck.extraIds);
    }

    @ResolveField(() => [Card])
    public async side(@Root() deck: Deck) {
        return this.cardService.findByIds(deck.sideIds);
    }
}
