import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { CardResolver } from "@card/card.resolver";
import { CardSuggestionResolver } from "@card/card-suggestion.resolver";
import { CardUpdateProcessor } from "@card/card-update.processor";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";

import { DeckModule } from "@deck/deck.module";
import { BullModule } from "@nestjs/bull";

@Module({
    imports: [
        BullModule.registerQueue({
            name: "card-update",
        }),
        TypeOrmModule.forFeature([Card, Text]),
        forwardRef(() => DeckModule),
    ],
    providers: [CardService, CardResolver, CardSuggestionResolver, CardUpdateProcessor],
    exports: [CardService],
})
export class CardModule {}
