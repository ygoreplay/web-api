import { Field, Float, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class WinRate {
    @Field(() => String)
    public deckName!: string;

    @Field(() => Float)
    public rate!: number;
}
