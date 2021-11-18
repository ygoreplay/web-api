import { Card } from "@card/models/Card.model";
import { Field, Float, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class WinRate {
    @Field(() => String)
    public deckName!: string;

    @Field(() => Float)
    public rate!: number;

    @Field(() => Card, { nullable: true })
    public titleCard!: Card;
}
