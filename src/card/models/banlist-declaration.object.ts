import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BanListDeclaration {
    @Field(() => [Int])
    public forbidden!: number[];

    @Field(() => [Int])
    public limit!: number[];

    @Field(() => [Int])
    public semiLimit!: number[];
}
