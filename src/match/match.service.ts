import { MoreThan, Repository } from "typeorm";
import * as moment from "moment";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Match from "@match/models/match.model";

import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@replay/models/match-rule.model";

@Injectable()
export class MatchService {
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
        type: Match["type"] = "normal",
        isRandomMatch: boolean,
        rounds: Round[],
        players: Player[],
        startedAt: number,
        finishedAt: number,
        matchRule: MatchRule,
    ) {
        const match = this.matchRepository.create();
        match.rounds = rounds;
        match.type = type || "normal";
        match.isRandomMatch = isRandomMatch;
        match.players = players;
        match.startedAt = moment.unix(startedAt).toDate();
        match.finishedAt = moment.unix(finishedAt).toDate();
        match.matchRule = matchRule;

        return this.matchRepository.save(match);
    }
}
