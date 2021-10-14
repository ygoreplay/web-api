import { Inject } from "@nestjs/common";
import { ResolveField, Resolver, Root } from "@nestjs/graphql";

import Deck from "@deck/models/deck.model";
import { Card } from "@card/models/Card.model";
import { CardService } from "@card/card.service";

@Resolver(() => Deck)
export class DeckResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService) {}

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
