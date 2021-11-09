import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DeckUsage {
    @Field(() => String)
    public deckName!: string;

    @Field(() => Int)
    public count!: number;
}
