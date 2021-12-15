import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CardModule } from "@card/card.module";

import { ChampionshipService } from "@championship/championship.service";
import { ChampionshipResolver } from "@championship/championship.resolver";

import { Championship } from "@championship/models/championship.model";
import { ChampionshipParticipant } from "@championship/models/championship-participant.model";

@Module({
    imports: [TypeOrmModule.forFeature([Championship, ChampionshipParticipant]), CardModule],
    providers: [ChampionshipService, ChampionshipResolver],
})
export class ChampionshipModule {}
