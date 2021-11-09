import { Repository } from "typeorm";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import MatchRule from "@match-rule/models/match-rule.model";

export interface RawRoomSettings {
    lflist: {
        date: string;
        tcg: boolean;
    };
    rule: number;
    mode: number;
    duel_rule: number;
    no_check_deck: boolean;
    no_shuffle_deck: boolean;
    start_lp: number;
    start_hand: number;
    draw_count: number;
    time_limit: number;
}

@Injectable()
export class MatchRuleService {
    public constructor(@InjectRepository(MatchRule) private readonly matchRuleRepository: Repository<MatchRule>) {}

    public findById(matchRuleId: number) {
        return this.matchRuleRepository.findOne({
            where: {
                id: matchRuleId,
            },
        });
    }

    public async ensure(roomSettings: RawRoomSettings) {
        let matchRule = await this.matchRuleRepository.findOne({
            where: {
                banListDate: roomSettings.lflist.date,
                isTCG: roomSettings.lflist.tcg,
                rule: roomSettings.rule,
                mode: roomSettings.mode,
                duelRule: roomSettings.duel_rule,
                preventCheckDeck: roomSettings.no_check_deck,
                preventShuffleDeck: roomSettings.no_shuffle_deck,
                startLifePoint: roomSettings.start_lp,
                startHand: roomSettings.start_hand,
                drawCount: roomSettings.draw_count,
                timeLimit: roomSettings.time_limit,
            },
        });

        if (!matchRule) {
            matchRule = this.matchRuleRepository.create();
            matchRule.banListDate = roomSettings.lflist.date;
            matchRule.isTCG = roomSettings.lflist.tcg;
            matchRule.rule = roomSettings.rule;
            matchRule.mode = roomSettings.mode;
            matchRule.duelRule = roomSettings.duel_rule;
            matchRule.preventCheckDeck = roomSettings.no_check_deck;
            matchRule.preventShuffleDeck = roomSettings.no_shuffle_deck;
            matchRule.startLifePoint = roomSettings.start_lp;
            matchRule.startHand = roomSettings.start_hand;
            matchRule.drawCount = roomSettings.draw_count;
            matchRule.timeLimit = roomSettings.time_limit;
            matchRule = await this.matchRuleRepository.save(matchRule);
        }

        return matchRule;
    }

    public async getAvailableBanLists() {
        const allBanLists = await this.matchRuleRepository
            .createQueryBuilder("m-r")
            .select("`m-r`.`banListDate`", "date")
            .addSelect("`m-r`.`isTCG`", "isTCG")
            .groupBy("`date`")
            .addGroupBy("`isTCG`")
            .getRawMany<{ date: string; isTCG: string }>()
            .then(data => data.map(i => ({ date: i.date, isTCG: Boolean(parseInt(i.isTCG, 10)) })));

        return allBanLists.map(bl => `${bl.date} ${bl.isTCG ? "TCG" : "OCG"}`);
    }
}
