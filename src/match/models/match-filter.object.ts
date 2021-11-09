import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class MatchFilter {
    @Field(() => Boolean)
    public includeMatches: boolean;

    @Field(() => Boolean)
    public includeSingles: boolean;

    @Field(() => Boolean)
    public includeTierMatches: boolean;

    @Field(() => Boolean)
    public includeNormalMatches: boolean;

    @Field(() => [String])
    public banLists: string[];
}
