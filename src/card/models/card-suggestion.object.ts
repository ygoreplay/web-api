import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Card } from "@card/models/Card.model";

@ObjectType()
export class CardSuggestion {
    @Field(() => Int)
    public index!: number;

    @Field(() => Int)
    public id!: number;

    @Field(() => String)
    public name!: string;

    public card!: Card;
}
