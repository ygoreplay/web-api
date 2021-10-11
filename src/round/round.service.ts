import * as moment from "moment";
import * as path from "path";
import * as fs from "fs-extra";
import { Repository } from "typeorm";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import Round from "@round/models/round.model";
import Deck from "@deck/models/deck.model";
import Player from "@player/models/player.model";
import PlayerDeck from "@round/models/player-deck.model";

const REPLAY_STORAGE_PATH = path.join(process.cwd(), "./replays");
fs.ensureDirSync(REPLAY_STORAGE_PATH);

@Injectable()
export class RoundService {
    private static async saveReplayFile(id: number, data: Buffer) {
        const targetPath = path.join(REPLAY_STORAGE_PATH, `./${id}.yrp`);
        await fs.promises.writeFile(targetPath, data);

        return targetPath;
    }

    public constructor(
        @InjectRepository(Round) private readonly roundRepository: Repository<Round>,
        @InjectRepository(PlayerDeck) private readonly playerDeckRepository: Repository<PlayerDeck>,
    ) {}

    public async create(
        no: number,
        from: string,
        startedAt: number,
        finishedAt: number,
        playerDecks: [Player, Deck][],
        replayData: Buffer,
        winnerPlayer: Player,
    ) {
        let round = this.roundRepository.create();
        round.replayFilePath = "";
        round.no = no;
        round.from = from;
        round.startedAt = moment.unix(startedAt).toDate();
        round.finishedAt = moment.unix(finishedAt).toDate();
        round.playerDecks = playerDecks.map(this.generatePlayerDeck);
        round.winner = winnerPlayer;
        round = await this.roundRepository.save(round);

        round.replayFilePath = await RoundService.saveReplayFile(round.id, replayData);
        return this.roundRepository.save(round);
    }

    private generatePlayerDeck = (playerDeck: [Player, Deck]) => {
        const pd = this.playerDeckRepository.create();
        pd.player = playerDeck[0];
        pd.deck = playerDeck[1];

        return pd;
    };
}
