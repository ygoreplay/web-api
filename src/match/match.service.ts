import * as _ from "lodash";
import { MoreThan, Repository } from "typeorm";
import * as moment from "moment";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Match, { MatchType } from "@match/models/match.model";
import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@match-rule/models/match-rule.model";

import { pubSub } from "@root/pubsub";

export interface MatchResultData {
    matchId: number;
    matchStartedAt: Date;
    playerId: number;
    deckName: string;
    won: boolean;
}

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

    public findAll() {
        return this.matchRepository.find();
    }
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
    public findById(id: number) {
        return this.matchRepository.findOne({
            where: {
                id,
            },
        });
    }
    public count() {
        return this.matchRepository.count();
    }

    public async getMatchResultData(match?: Match): Promise<MatchResultData[]> {
        let matchResultQuery = await this.matchRepository
            .createQueryBuilder("m")
            .select("`m`.`id`", "matchId")
            .addSelect("`m`.`startedAt`", "matchStartedAt")
            .addSelect("`p`.`id`", "playerId")
            .addSelect("`d`.`recognizedName`", "deckName")
            .addSelect("(`m`.`winnerId` = `p-d`.`playerId`)", "won")
            .innerJoin("rounds", "r", "`r`.`matchId` = `m`.`id` AND `r`.`no` = 0")
            .innerJoin("player-decks", "p-d", "`r`.`id` = `p-d`.`matchId`")
            .innerJoin("decks", "d", "`p-d`.`deckId` = `d`.`id`")
            .innerJoin("players", "p", "`p-d`.`playerId` = `p`.`id`")
            .where("`m`.`winnerId` IS NOT NULL");

        if (match) {
            matchResultQuery = matchResultQuery.andWhere("`m`.`id` = :matchId", { matchId: match.id });
        }

        const matchResult = await matchResultQuery.getRawMany<{ matchId: string; deckName: string; won: string; playerId: string; matchStartedAt: Date }>();

        return matchResult.map<MatchResultData>(r => ({
            matchId: parseInt(r.matchId, 10),
            matchStartedAt: r.matchStartedAt,
            playerId: parseInt(r.playerId, 10),
            won: Boolean(parseInt(r.won, 10)),
            deckName: r.deckName,
        }));
    }
    public async getWinRate(count: number): Promise<[string, number][]> {
        const allDecksObject = await this.matchRepository
            .createQueryBuilder("m")
            .select("`m`.`id`", "matchId")
            .addSelect("`r`.`id`", "roundId")
            .addSelect("`p-d`.`deckId`", "deckId")
            .addSelect("`d`.`recognizedName`", "name")
            .addSelect("`d`.`recognizedDeckTags`", "tags")
            .leftJoin("rounds", "r", "`m`.`id` = `r`.`matchId` AND `r`.`no` = 0")
            .leftJoin("player-decks", "p-d", "`p-d`.`matchId` = `r`.`id`")
            .leftJoin("decks", "d", "`d`.`id` = `p-d`.`deckId`")
            .getRawMany<{ name: string; tags: string }>();

        const allWinningDecksObject = await this.matchRepository
            .createQueryBuilder("m")
            .select("`m`.`id`", "matchId")
            .addSelect("`r`.`id`", "roundId")
            .addSelect("`p-d`.`deckId`", "deckId")
            .addSelect("`d`.`recognizedName`", "name")
            .addSelect("`d`.`recognizedDeckTags`", "tags")
            .leftJoin("rounds", "r", "`m`.`id` = `r`.`matchId` AND `r`.`no` = 0")
            .leftJoin("player-decks", "p-d", "`p-d`.playerId = `m`.`winnerId` AND `p-d`.`matchId` = `r`.`id`")
            .leftJoin("decks", "d", "`d`.`id` = `p-d`.`deckId`")
            .getRawMany<{ name: string; tags: string }>();

        const allDecks = _.countBy(allDecksObject, d => d.name);
        const allWinningDecks = _.countBy(allWinningDecksObject, d => d.name);

        const topAppearingDecks = _.chain(allDecks)
            .entries()
            .sortBy(p => p[1])
            .reverse()
            .value()
            .slice(0, count);

        for (const [deckName] of topAppearingDecks) {
            topAppearingDecks[deckName] = _.sum(
                Object.entries(allDecks)
                    .filter(([d]) => d.endsWith(deckName))
                    .map(p => p[1]),
            );

            allWinningDecks[deckName] = _.sum(
                Object.entries(allWinningDecks)
                    .filter(([d]) => d.endsWith(deckName))
                    .map(p => p[1]),
            );
        }

        for (const [deckName, appearCount] of Object.entries(allDecks)) {
            allDecks[deckName] = deckName in allWinningDecks ? allWinningDecks[deckName] / appearCount : 0;
        }

        return _.chain(topAppearingDecks)
            .map(p => [p[0], allDecks[p[0]]])
            .sortBy(p => p[1])
            .reverse()
            .value() as [string, number][];
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
        await pubSub.publish("matchCountUpdated", { matchCountUpdated: await this.count() });

        return result;
    }
}
