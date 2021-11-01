import * as _ from "lodash";
import { Repository } from "typeorm";

import { Process, Processor } from "@nestjs/bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Inject, Logger } from "@nestjs/common";

import { MatchService } from "@match/match.service";

import { WinRateData } from "@deck/models/win-rate.model";
import { DeckService } from "@deck/deck.service";

@Processor("win-rate")
export class WinRateProcessor {
    private readonly logger = new Logger(WinRateProcessor.name);

    public constructor(
        @Inject(MatchService) private readonly matchService: MatchService,
        @Inject(DeckService) private readonly deckService: DeckService,
        @InjectRepository(WinRateData) private readonly winRateDataRepository: Repository<WinRateData>,
    ) {}

    @Process("migrate")
    public async handleMigrate() {
        this.logger.debug("Start migration...");

        const matchResults = await this.matchService.getMatchResultData();
        const matchResultChunks = _.chunk(matchResults, 5000);
        let insertedCount = 0;
        for (const matchResultChunk of matchResultChunks) {
            const winRateDataArray = this.deckService.composeMatchResultToWinRate(matchResultChunk);
            await this.winRateDataRepository.createQueryBuilder().insert().values(winRateDataArray).execute();
            insertedCount += winRateDataArray.length;

            this.logger.log(`Successfully integrated ${winRateDataArray.length} of match data. (${insertedCount}/${matchResults.length})`);
        }

        this.logger.debug("Migration completed");
    }
}
