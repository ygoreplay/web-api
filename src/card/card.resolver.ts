import { Inject } from "@nestjs/common";
import { Resolver, Query, Args, Int, ResolveField, registerEnumType, Root } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

enum CardType {
    Monster = "monster",
    Spell = "Spell",
    Trap = "Trap",
}

registerEnumType(CardType, { name: "CardType" });

@Resolver(() => Card)
export class CardResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService) {}

    @Query(() => Card, { nullable: true })
    public async card(@Args("id", { type: () => Int }) id: number) {
        return this.cardService.findById(id);
    }

    @ResolveField(() => CardType)
    public async type(@Root() card: Card) {
        if (card.isMonster) {
            return CardType.Monster;
        }

        if (card.isTrap) {
            return CardType.Trap;
        }

        return CardType.Spell;
    }
}
