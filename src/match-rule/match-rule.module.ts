import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MatchRuleResolver } from "@match-rule/match-rule.resolver";
import { MatchRuleService } from "@match-rule/match-rule.service";

import MatchRule from "@match-rule/models/match-rule.model";

@Module({
    imports: [TypeOrmModule.forFeature([MatchRule])],
    providers: [MatchRuleResolver, MatchRuleService],
    exports: [MatchRuleService],
})
export class MatchRuleModule {}
