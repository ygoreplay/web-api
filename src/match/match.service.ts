import { MoreThan, Repository } from "typeorm";
import * as moment from "moment";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Match, { MatchType } from "@match/models/match.model";

import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@match-rule/models/match-rule.model";
import { pubSub } from "@root/pubsub";

@Injectable()
export class MatchService {
    private static convertStringToMatchType(type: string) {
        switch (type) {
            case MatchType.Athletic:
                return MatchType.Athletic;

            case MatchType.Entertain:
                return MatchType.Entertain;

            case MatchType.Normal:
                return MatchType.Normal;

            default:
                throw new Error(`Undefined match type: '${type}'`);
        }
    }

    public constructor(@InjectRepository(Match) private readonly matchRepository: Repository<Match>) {}

    public find(count: number, after?: Match["id"]) {
        return this.matchRepository.find({
            where: after
                ? {
                      id: MoreThan(after),
                  }
                : {},
            take: count,
            order: {
                id: "DESC",
            },
        });
    }

    public async create(
        type: Match["type"] | string = MatchType.Normal,
        isRandomMatch: boolean,
        rounds: Round[],
        players: Player[],
        startedAt: number,
        finishedAt: number,
        matchRule: MatchRule,
        winner: Player | null,
    ) {
        const match = this.matchRepository.create();
        match.rounds = rounds;
        match.type = MatchService.convertStringToMatchType(type);
        match.isRandomMatch = isRandomMatch;
        match.players = players;
        match.startedAt = moment.unix(startedAt).toDate();
        match.finishedAt = moment.unix(finishedAt).toDate();
        match.matchRule = matchRule;
        match.winner = winner;

        const result = this.matchRepository.save(match);
        await pubSub.publish("newMatchCreated", { newMatchCreated: result });

        return result;
    }
}
