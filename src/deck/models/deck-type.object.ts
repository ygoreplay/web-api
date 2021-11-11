import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DeckType {
    @Field(() => Int)
    public id!: number;

    @Field(() => String)
    public name!: string;
}
