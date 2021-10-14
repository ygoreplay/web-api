import { Inject } from "@nestjs/common";
import { ResolveField, Resolver, Root } from "@nestjs/graphql";

import Deck from "@deck/models/deck.model";
import { Card } from "@card/models/Card.model";
import { CardService } from "@card/card.service";

@Resolver(() => Deck)
export class DeckResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService) {}

    @ResolveField(() => [Card])
    public async mainCards(@Root() deck: Deck) {
        return this.cardService.findByIds(deck.main);
    }
}
