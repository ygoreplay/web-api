import { Resolver } from "@nestjs/graphql";

import Match from "@match/models/match.model";

@Resolver(() => Match)
export class MatchResolver {}
