import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class DeckTitleCardInput {
    @Field(() => Int)
    public cardId!: number;

    @Field(() => String)
    public deckName!: string;
}
