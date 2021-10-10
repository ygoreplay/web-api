import { Query, Resolver } from "@nestjs/graphql";

import Match from "@replay/models/match.model";

@Resolver(() => Match)
export class ReplayResolver {
    @Query(() => [Match])
    public async matches() {
        return [];
    }
}
