import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ExecutionResult {
    @Field(() => Boolean)
    public succeeded!: boolean;

    @Field(() => [String])
    public errors!: string[];
}
