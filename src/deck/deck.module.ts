import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";

import { DeckResolver } from "@deck/deck.resolver";
import { DeckService } from "@deck/deck.service";
import { WinRateProcessor } from "@deck/win-rate.processor";
import Deck from "@deck/models/deck.model";
import { WinRateData } from "@deck/models/win-rate.model";
import { DeckTitleCard } from "@deck/models/deck-title-card.model";
import { Championship } from "@deck/models/championship.model";

import { CardModule } from "@card/card.module";
import { MatchModule } from "@match/match.module";
import { StorageModule } from "@storage/storage.module";

@Module({
    imports: [
        BullModule.registerQueue({
            name: "win-rate",
        }),
        TypeOrmModule.forFeature([Deck, WinRateData, DeckTitleCard, Championship]),
        forwardRef(() => CardModule),
        forwardRef(() => MatchModule),
        forwardRef(() => StorageModule),
    ],
    providers: [DeckResolver, DeckService, WinRateProcessor],
    exports: [DeckService],
})
export class DeckModule {}
