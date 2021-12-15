import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class CreateChampionshipResult {
    @Field(() => String)
    public joinUrl!: string;

    @Field(() => String)
    public monitorUrl!: string;
}
