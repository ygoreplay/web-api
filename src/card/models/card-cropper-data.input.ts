import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CardCropperDataInput {
    @Field(() => Int)
    public cardId: number;

    @Field(() => Int)
    public x!: number;

    @Field(() => Int)
    public y!: number;

    @Field(() => Int)
    public width!: number;

    @Field(() => Int)
    public height!: number;
}
