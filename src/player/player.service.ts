import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Player from "@player/models/player.model";
import { Repository } from "typeorm";

export interface RawPlayerInformation {
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

@Injectable()
export class PlayerService {
    public constructor(@InjectRepository(Player) private readonly playerRepository: Repository<Player>) {}

    public async ensure(playerData: RawPlayerInformation) {
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

    public async findById(playerId: Player["id"]) {
        return this.playerRepository.findOne({
            where: {
                id: playerId,
            },
        });
    }
}
