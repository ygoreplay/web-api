import { Inject } from "@nestjs/common";
import { Args, Int, Mutation, Query, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

import { DeckService } from "@deck/deck.service";
import Deck from "@deck/models/deck.model";
import { WinRate } from "@deck/models/win-rate.object";
import { DeckUsage } from "@deck/models/deck-usage.object";
import { DeckType } from "@deck/models/deck-type.object";
import { DeckTitleCard } from "@deck/models/deck-title-card.model";
import { DeckTitleCardInput } from "@deck/models/deck-title-card.input";
import { CreateChampionshipArgs } from "@deck/models/create-championship-args.input";
import { CreateChampionshipResult } from "@deck/models/create-championship-result.object";
import { Championship } from "@deck/models/championship.model";

@Resolver(() => Deck)
export class DeckResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService, @Inject(DeckService) private readonly deckService: DeckService) {}

    @Query(() => Championship, { nullable: true })
    public async championship(@Args("id", { type: () => String }) id: string) {
        return this.deckService.findChampionship(id);
    }

    @Query(() => [Card])
    public async usedCards(@Args("deckName") deckName: string) {
        return this.deckService.getUsedCards(deckName);
    }

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
        return this.deckService.getWinRates(count);
    }

    @Mutation(() => [DeckTitleCard])
    public async registerDeckTitleCards(@Args("input", { type: () => [DeckTitleCardInput] }) input: DeckTitleCardInput[]) {
        return this.deckService.registerDeckTitleCards(input);
    }

    @Mutation(() => String)
    public async generateDeckRecipeImage(
        @Args("mainDeck", { type: () => [Int] }) mainDeck: number[],
        @Args("extraDeck", { type: () => [Int] }) extraDeck: number[],
        @Args("sideDeck", { type: () => [Int] }) sideDeck: number[],
    ) {
        return this.deckService.generateDeckRecipeImage(mainDeck, extraDeck, sideDeck);
    }

    @Mutation(() => CreateChampionshipResult)
    public async createChampionship(@Args("data", { type: () => CreateChampionshipArgs }) data: CreateChampionshipArgs) {
        return this.deckService.createChampionship(data);
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
