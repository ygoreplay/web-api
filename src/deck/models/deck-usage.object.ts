import { Field, Int, ObjectType } from "@nestjs/graphql";

import { Card } from "@card/models/Card.model";

@ObjectType()
export class DeckUsage {
    @Field(() => String)
    public deckName!: string;

    @Field(() => Int)
    public count!: number;

    @Field(() => Card, { nullable: true })
    public titleCard!: Card;
}
