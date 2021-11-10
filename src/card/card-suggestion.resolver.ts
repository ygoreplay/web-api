import { Context, Int, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { CardSuggestion } from "@card/models/card-suggestion.object";

import { GraphQLContext } from "@root/types";

@Resolver(() => CardSuggestion)
export class CardSuggestionResolver {
    @ResolveField(() => Int)
    public async index(@Root() root: CardSuggestion, @Context() graphqlContext: GraphQLContext) {
        return graphqlContext.cardIndexLoader.load(root.card.id);
    }
}
