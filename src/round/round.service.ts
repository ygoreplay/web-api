import * as moment from "moment";
import { Repository } from "typeorm";

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { StorageService } from "@storage/storage.service";

import Round from "@round/models/round.model";
import Deck from "@deck/models/deck.model";
import Player from "@player/models/player.model";
import PlayerDeck from "@round/models/player-deck.model";

const REPLAY_BUCKET_NAME = process.env.NODE_ENV === "production" ? "replays" : "replays-test";

@Injectable()
export class RoundService implements OnModuleInit {
    public constructor(
        @Inject(StorageService) private readonly storageService: StorageService,
        @InjectRepository(Round) private readonly roundRepository: Repository<Round>,
        @InjectRepository(PlayerDeck) private readonly playerDeckRepository: Repository<PlayerDeck>,
    ) {}

    public async onModuleInit() {
        await this.storageService.ensureBucket(REPLAY_BUCKET_NAME);
    }

    public async findByIds(ids: Round["id"][]) {
        return this.roundRepository.findByIds(ids);
    }

    public async getPlayerDecks(round: Round) {
        return await this.playerDeckRepository.findByIds(round.playerDeckIds);
    }

    public async create(
        no: number,
        from: string,
        startedAt: number,
        finishedAt: number,
        playerDecks: [Player, Deck][],
        replayData: Buffer,
        winnerPlayer: Player | null,
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

        round.replayFilePath = await this.saveReplayFile(round.id, replayData);
        return this.roundRepository.save(round);
    }

    private generatePlayerDeck = (playerDeck: [Player, Deck]) => {
        const pd = this.playerDeckRepository.create();
        pd.player = playerDeck[0];
        pd.deck = playerDeck[1];

        return pd;
    };

    private async saveReplayFile(id: number, data: Buffer) {
        const uploaded = await this.storageService.upload(data, `${id}.yrp`, REPLAY_BUCKET_NAME);
        return uploaded.Key;
    }
}
