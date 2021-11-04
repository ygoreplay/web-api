import { Repository } from "typeorm";
import * as moment from "moment";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Match, { MatchType } from "@match/models/match.model";
import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@match-rule/models/match-rule.model";

import { pubSub } from "@root/pubsub";
import { MatchFilter } from "@match/models/match-filter.object";

export interface MatchResultData {
    matchId: number;
    matchStartedAt: Date;
    playerId: number;
    deckName: string;
    deckTags: string[];
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
    public async find(count: number, after?: Match["id"], filter?: MatchFilter) {
        // SELECT
        //     `m`.*
        // FROM
        //     `matches` `m`
        // LEFT JOIN `match-rules` `m-r` ON `m`.`matchRuleId` = `m-r`.`id`
        // WHERE
        //     `m`.`type` IN ('athletic') AND
        //     `m-r`.`mode` IN (0, 1)

        let matchTypes: MatchType[] = [];
        let matchModes: Array<0 | 1 | 2> = [];
        if (typeof filter === "undefined") {
            matchModes = [0, 1];
            matchTypes = [MatchType.Normal, MatchType.Athletic];
        } else {
            if (filter.includeNormalMatches) {
                matchTypes.push(MatchType.Normal);
            }
            if (filter.includeTierMatches) {
                matchTypes.push(MatchType.Athletic);
            }

            if (filter.includeMatches) {
                matchModes.push(1);
            }
            if (filter.includeSingles) {
                matchModes.push(0);
            }
        }

        let queryBuilder = this.matchRepository
            .createQueryBuilder("m")
            .select("`m`.`id`", "id")
            .leftJoin("match-rules", "m-r", "`m`.`matchRuleId` = `m-r`.`id`")
            .where("1=1");

        if (matchTypes.length > 0) {
            queryBuilder = queryBuilder.where("`m`.`type` IN (:matchTypes)", { matchTypes });
        } else {
            queryBuilder = queryBuilder.where("`m`.`type` IS NULL");
        }

        if (matchModes.length > 0) {
            queryBuilder = queryBuilder.andWhere("`m-r`.`mode` IN (:matchModes)", { matchModes });
        } else {
            queryBuilder = queryBuilder.andWhere("`m-r`.`mode` IS NULL");
        }

        if (after) {
            queryBuilder = queryBuilder.andWhere("`m`.`id` < :after", { after });
        }

        const targetIds = await queryBuilder
            .orderBy("`m`.`id`", "DESC")
            .offset(0)
            .limit(count)
            .getRawMany<{ id: string }>()
            .then(data => data.map(d => parseInt(d.id, 10)));
        const matches = await this.matchRepository.findByIds(targetIds);

        return targetIds.map(id => {
            const target = matches.find(m => m.id === id);
            if (!target) {
                throw new Error(`Failed find a match with id: ${id}`);
            }

            return target;
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
            .addSelect("`d`.`recognizedDeckTags`", "deckTags")
            .addSelect("(`m`.`winnerId` = `p-d`.`playerId`)", "won")
            .innerJoin("rounds", "r", "`r`.`matchId` = `m`.`id` AND `r`.`no` = 0")
            .innerJoin("player-decks", "p-d", "`r`.`id` = `p-d`.`matchId`")
            .innerJoin("decks", "d", "`p-d`.`deckId` = `d`.`id`")
            .innerJoin("players", "p", "`p-d`.`playerId` = `p`.`id`")
            .where("`m`.`winnerId` IS NOT NULL");

        if (match) {
            matchResultQuery = matchResultQuery.andWhere("`m`.`id` = :matchId", { matchId: match.id });
        }

        const matchResult = await matchResultQuery.getRawMany<{
            matchId: string;
            deckName: string;
            won: string;
            playerId: string;
            matchStartedAt: Date;
            deckTags: string;
        }>();

        return matchResult.map<MatchResultData>(r => ({
            matchId: parseInt(r.matchId, 10),
            matchStartedAt: r.matchStartedAt,
            playerId: parseInt(r.playerId, 10),
            won: Boolean(parseInt(r.won, 10)),
            deckTags: r.deckTags.split(","),
            deckName: r.deckName,
        }));
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
