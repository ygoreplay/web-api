import { Resolver } from "@nestjs/graphql";

import MatchRule from "@match-rule/models/match-rule.model";

@Resolver(() => MatchRule)
export class MatchRuleResolver {}
