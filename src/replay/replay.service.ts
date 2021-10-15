import * as _ from "lodash";
import { Inject, Injectable, Logger } from "@nestjs/common";

import { MatchService } from "@match/match.service";
import { RoundService } from "@round/round.service";
import { DeckService } from "@deck/deck.service";
import { PlayerService, RawPlayerInformation } from "@player/player.service";

import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import Deck from "@deck/models/deck.model";
import { MatchType } from "@match/models/match.model";
import { MatchRuleService, RawRoomSettings } from "@match-rule/match-rule.service";

interface HeaderData {
    roomSettings: RawRoomSettings;
    players: RawPlayerInformation[];
    startedAt: number[];
    finishedAt: number[];
    isRandomMatch: boolean;
    type?: "normal" | "athletic" | "entertain";
    winnerNames?: string[];
    scores?: { [playerName: string]: number };
}

@Injectable()
export class ReplayService {
    private static readonly logger: Logger = new Logger(ReplayService.name);

    public constructor(
        @Inject(MatchService) private readonly matchService: MatchService,
        @Inject(RoundService) private readonly roundService: RoundService,
        @Inject(DeckService) private readonly deckService: DeckService,
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @Inject(MatchRuleService) private readonly matchRuleService: MatchRuleService,
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
            if (
                !headerData ||
                !headerData.players ||
                !headerData.finishedAt ||
                !headerData.startedAt ||
                !headerData.roomSettings ||
                headerData.players.some(p => !p.sidedDeck)
            ) {
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

            // 덱 데이터가 누락된 경우에는 저장을 피해야 한다.
            if (headerData.players[0].sidedDeck.length !== headerData.players[1].sidedDeck.length) {
                throw new Error("deck count of both of player doesn't match.");
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

                const winnerPlayer = headerData.winnerNames ? posPlayerPairs.map(p => p[1]).find(p => p.name === headerData.winnerNames[i]) : null;
                const round = await this.roundService.create(
                    i,
                    from,
                    headerData.startedAt[i],
                    headerData.finishedAt[i],
                    playerDecks,
                    replayDataArray[i],
                    winnerPlayer,
                );

                rounds.push(round);
            }

            let winnerPlayer: Player | null = null;
            if (headerData.scores) {
                const winnerName = _.chain(headerData.scores)
                    .entries()
                    .sortBy(p => p[1])
                    .reverse()
                    .value()[0][0];
                winnerPlayer = posPlayerPairs.map(p => p[1]).find(p => p.name === winnerName) || null;
            }

            return this.matchService.create(
                headerData.type || MatchType.Normal,
                headerData.isRandomMatch,
                rounds,
                posPlayerPairs.map(p => p[1]),
                headerData.startedAt[0],
                headerData.finishedAt.pop(),
                await this.matchRuleService.ensure(headerData.roomSettings),
                winnerPlayer,
            );
        } catch (e) {
            ReplayService.logger.error("Catched an exception during process match data:");
            console.error(e);
        }
    }
}
