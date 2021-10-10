import * as moment from "moment";
import { Repository } from "typeorm";
import * as fs from "fs-extra";
import * as path from "path";

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Match from "@replay/models/match.model";
import MatchRule from "@replay/models/match-rule.model";
import Round from "@replay/models/round.model";
import Player from "@replay/models/player.model";
import Deck from "@replay/models/deck.model";
import PlayerDeck from "@replay/models/player-deck.model";

interface RawPlayerInformation {
    ip: string;
    name: string;
    joinTime: string; //'2021-07-04 00:44:19',
    pos: number;
    lang: string; // "ko-kr";
    pass: string; // "M#123";
    sidedDeck: Array<{
        main: number[];
        side: number[];
    }>;
}

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

const REPLAY_STORAGE_PATH = path.join(process.cwd(), "./replays");
fs.ensureDirSync(REPLAY_STORAGE_PATH);

@Injectable()
export class ReplayService {
    private static readonly logger: Logger = new Logger(ReplayService.name);

    private static async saveReplayFile(id: number, data: Buffer) {
        const targetPath = path.join(REPLAY_STORAGE_PATH, `./${id}.yrp`);
        await fs.promises.writeFile(targetPath, data);

        return targetPath;
    }

    public constructor(
        @InjectRepository(MatchRule) private readonly matchRuleRepository: Repository<MatchRule>,
        @InjectRepository(Match) private readonly matchRepository: Repository<Match>,
        @InjectRepository(Round) private readonly roundRepository: Repository<Round>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
        @InjectRepository(PlayerDeck) private readonly playerDeckRepository: Repository<PlayerDeck>,
    ) {}

    public async find() {
        return this.matchRepository.find();
    }

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
                const playerDecks: PlayerDeck[] = [];
                for (const playerData of headerData.players) {
                    const { main, side } = playerData.sidedDeck[i];
                    const deck = await this.registerDeck(main, side);

                    let posPlayerPair = posPlayerPairs.find(ppp => ppp[0] === playerData.pos);
                    if (!posPlayerPair) {
                        posPlayerPair = [playerData.pos, await this.getOrCreatePlayer(playerData)];
                        posPlayerPairs.push(posPlayerPair);
                    }

                    const player = posPlayerPair[1];
                    const playerDeck = this.playerDeckRepository.create();
                    playerDeck.player = player;
                    playerDeck.deck = deck;
                    playerDecks.push(playerDeck);
                }

                const round = this.roundRepository.create();
                round.replayFilePath = "";
                round.no = i;
                round.from = from;
                round.startedAt = moment.unix(headerData.startedAt[i]).toDate();
                round.finishedAt = moment.unix(headerData.finishedAt[i]).toDate();
                round.playerDecks = playerDecks;
                round.replayFilePath = await ReplayService.saveReplayFile(round.id, replayDataArray[i]);

                rounds.push(round);
            }

            const match = this.matchRepository.create();
            match.rounds = rounds;
            match.type = headerData.type || "normal";
            match.isRandomMatch = headerData.isRandomMatch;
            match.players = posPlayerPairs.map(p => p[1]);
            match.startedAt = moment.unix(headerData.startedAt[0]).toDate();
            match.finishedAt = moment.unix(headerData.finishedAt.pop()).toDate();
            match.matchRule = await this.getOrCreateMatchRule(headerData.roomSettings);

            await this.matchRepository.save(match);
        } catch (e) {
            ReplayService.logger.error("Catched an exception during process match data:");
            console.error(e);
        }
    }

    private async registerDeck(main: number[], side: number[]): Promise<Deck> {
        const deck = await this.deckRepository.create();
        deck.main = main;
        deck.side = side;

        return this.deckRepository.save(deck);
    }
    private async getOrCreatePlayer(playerData: HeaderData["players"][0]): Promise<Player> {
        let player = await this.playerRepository.findOne({
            where: {
                name: playerData.name,
                ip: playerData.ip,
                lang: playerData.lang,
                pos: playerData.pos,
            },
        });

        if (!player) {
            player = this.playerRepository.create();
            player.ip = playerData.ip;
            player.name = playerData.name;
            player.lang = playerData.lang;
            player.pos = playerData.pos;
            player = await this.playerRepository.save(player);
        }

        return player;
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
        }

        return matchRule;
    }
}
