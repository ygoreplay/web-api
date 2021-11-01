import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";

import { DeckResolver } from "@deck/deck.resolver";
import { DeckService } from "@deck/deck.service";
import { WinRateProcessor } from "@deck/win-rate.processor";
import Deck from "@deck/models/deck.model";
import { WinRateData } from "@deck/models/win-rate.model";

import { CardModule } from "@card/card.module";
import { MatchModule } from "@match/match.module";

@Module({
    imports: [
        BullModule.registerQueue({
            name: "win-rate",
        }),
        TypeOrmModule.forFeature([Deck, WinRateData]),
        CardModule,
        forwardRef(() => MatchModule),
    ],
    providers: [DeckResolver, DeckService, WinRateProcessor],
    exports: [DeckService],
})
export class DeckModule {}
