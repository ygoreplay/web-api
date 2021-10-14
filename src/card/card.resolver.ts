import { Inject } from "@nestjs/common";
import { Resolver, Query, Args, Int } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

@Resolver(() => Card)
export class CardResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService) {}

    @Query(() => Card, { nullable: true })
    public async card(@Args("id", { type: () => Int }) id: number) {
        return this.cardService.findById(id);
    }
}
