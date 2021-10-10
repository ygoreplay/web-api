import { Repository } from "typeorm";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import MatchRule from "@replay/models/match-rule.model";
import Round from "@round/models/round.model";
import Player from "@player/models/player.model";

import { MatchService } from "@match/match.service";
import { RoundService } from "@round/round.service";
import { DeckService } from "@deck/deck.service";
import { PlayerService, RawPlayerInformation } from "@player/player.service";
import Deck from "@deck/models/deck.model";

interface HeaderData {
    roomSettings: {
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
    };
    players: RawPlayerInformation[];
    startedAt: number[];
    finishedAt: number[];
    isRandomMatch: boolean;
    type?: "normal" | "athletic" | "entertain";
}

@Injectable()
export class ReplayService {
    private static readonly logger: Logger = new Logger(ReplayService.name);

    public constructor(
        @Inject(MatchService) private readonly matchService: MatchService,
        @Inject(RoundService) private readonly roundService: RoundService,
        @Inject(DeckService) private readonly deckService: DeckService,
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @InjectRepository(MatchRule) private readonly matchRuleRepository: Repository<MatchRule>,
    ) {}

    public async registerReplayData(buffer: Buffer, from: string) {
        try {
            const headerLength = buffer.readUInt32BE(0);
            const headerData: HeaderData = JSON.parse(buffer.slice(4, 4 + headerLength).toString("utf8"));
            const replayDataArray: Buffer[] = [];

            let rawReplayData = buffer.slice(4 + headerLength);
            while (rawReplayData.length >= 0) {
                const dataLength = rawReplayData.readUInt32BE();
                const replayData = rawReplayData.slice(4, 4 + dataLength);

                replayDataArray.push(replayData);
                if (rawReplayData.length - (4 + dataLength) === 0) {
                    break;
                }

                rawReplayData = rawReplayData.slice(4 + dataLength);
            }

            // 필요한 데이터가 없으면 처리가 불가능하다.
            if (!headerData || !headerData.players || !headerData.finishedAt || !headerData.startedAt || !headerData.roomSettings) {
                throw new Error("couldn't receive enough data to store.");
            }

            // 실제로 플레이한 라운드 수 보다 데이터가 적다면 부정 데이터이므로 처리하지 않도록 한다.
            const roundCount = replayDataArray.length;
            if (headerData.startedAt.length !== roundCount || headerData.finishedAt.length !== roundCount) {
                throw new Error("round replay data and timing data count is not matching.");
            }

            // 플레이어는 항상 2명 이상이여야 한다.
            if (headerData.players.length <= 1) {
                throw new Error("player count is not matching with minimum required value.");
            }

            const posPlayerPairs: [pos: number, player: Player][] = [];
            const rounds: Round[] = [];
            for (let i = 0; i < replayDataArray.length; i++) {
                const playerDecks: [Player, Deck][] = [];
                for (const playerData of headerData.players) {
                    const { main, side } = playerData.sidedDeck[i];
                    const deck = await this.deckService.create(main, side);

                    let posPlayerPair = posPlayerPairs.find(ppp => ppp[0] === playerData.pos);
                    if (!posPlayerPair) {
                        posPlayerPair = [playerData.pos, await this.playerService.ensure(playerData)];
                        posPlayerPairs.push(posPlayerPair);
                    }

                    playerDecks.push([posPlayerPair[1], deck]);
                }

                const round = await this.roundService.create(i, from, headerData.startedAt[i], headerData.finishedAt[i], playerDecks, replayDataArray[i]);
                rounds.push(round);
            }

            return this.matchService.create(
                headerData.type || "normal",
                headerData.isRandomMatch,
                rounds,
                posPlayerPairs.map(p => p[1]),
                headerData.startedAt[0],
                headerData.finishedAt.pop(),
                await this.getOrCreateMatchRule(headerData.roomSettings),
            );
        } catch (e) {
            ReplayService.logger.error("Catched an exception during process match data:");
            console.error(e);
        }
    }

    private async getOrCreateMatchRule(roomSettings: HeaderData["roomSettings"]) {
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
}
