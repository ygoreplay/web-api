import { Query, Resolver } from "@nestjs/graphql";

import { Inject } from "@nestjs/common";

import MatchRule from "@match-rule/models/match-rule.model";
import { MatchRuleService } from "@match-rule/match-rule.service";

@Resolver(() => MatchRule)
export class MatchRuleResolver {
    public constructor(@Inject(MatchRuleService) private readonly matchRuleService: MatchRuleService) {}

    @Query(() => [String])
    public async banLists(): Promise<string[]> {
        return this.matchRuleService.getAvailableBanLists();
    }
}
