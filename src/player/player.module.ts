import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PlayerResolver } from "@player/player.resolver";
import { PlayerService } from "@player/player.service";

import Player from "@player/models/player.model";

@Module({
    imports: [TypeOrmModule.forFeature([Player])],
    providers: [PlayerResolver, PlayerService],
    exports: [PlayerService],
})
export class PlayerModule {}
