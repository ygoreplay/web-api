import { Inject } from "@nestjs/common";
import { Args, Int, Mutation, Query, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

import { DeckService } from "@deck/deck.service";
import Deck from "@deck/models/deck.model";
import { WinRate } from "@deck/models/win-rate.object";
import { DeckUsage } from "@deck/models/deck-usage.object";
import { DeckType } from "@deck/models/deck-type.object";
import { DeckTitleCard } from "./models/deck-title-card.model";
import { DeckTitleCardInput } from "@deck/models/deck-title-card.input";

@Resolver(() => Deck)
export class DeckResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService, @Inject(DeckService) private readonly deckService: DeckService) {}

    @Query(() => Deck, { nullable: true })
    public async deck(@Args("id", { type: () => Int }) id: number) {
        return this.deckService.findById(id);
    }

    @Query(() => [DeckTitleCard])
    public async deckTitleCards() {
        return this.deckService.getAllTitleCards();
    }

    @Query(() => [DeckType])
    public async deckTypes() {
        return this.deckService.getDeckTypes();
    }

    @Query(() => [DeckUsage])
    public async topUsageDecks(@Args("count", { type: () => Int }) count: number) {
        return this.deckService.getTopUsageDecks(count);
    }

    @Query(() => [WinRate])
    public async winRate(@Args("count", { type: () => Int, defaultValue: 10 }) count: number) {
        const winRate = await this.deckService.getWinRates(count);
        return winRate.map<WinRate>(p => ({ rate: p[1], deckName: p[0] }));
    }

    @Mutation(() => [DeckTitleCard])
    public async registerDeckTitleCards(@Args("input", { type: () => [DeckTitleCardInput] }) input: DeckTitleCardInput[]) {
        return this.deckService.registerDeckTitleCards(input);
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

    @ResolveField(() => DeckTitleCard, { nullable: true })
    public async titleCard(@Root() root: Deck) {
        return this.deckService.getTitleCard(root.recognizedName);
    }
}
