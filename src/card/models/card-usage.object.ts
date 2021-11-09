import { Field, Float, ObjectType } from "@nestjs/graphql";
import { Card } from "@card/models/Card.model";

@ObjectType()
export class CardUsage {
    @Field(() => Card)
    public card!: Card;

    @Field(() => Float)
    public count!: number;
}
