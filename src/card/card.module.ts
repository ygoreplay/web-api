import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { CardResolver } from "@card/card.resolver";
import { CardSuggestionResolver } from "@card/card-suggestion.resolver";
import { CardUpdateProcessor } from "@card/card-update.processor";
import { CardCropperResolver } from "@card/card-cropper.resolver";
import { CardCropperService } from "@card/card-cropper.service";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { CardCropperItem } from "@card/models/card-cropper-item.model";

import { DeckModule } from "@deck/deck.module";
import { BullModule } from "@nestjs/bull";

@Module({
    imports: [
        BullModule.registerQueue({
            name: "card-update",
        }),
        TypeOrmModule.forFeature([Card, Text, CardCropperItem]),
        forwardRef(() => DeckModule),
    ],
    providers: [CardService, CardResolver, CardSuggestionResolver, CardUpdateProcessor, CardCropperResolver, CardCropperService],
    exports: [CardService, CardCropperService],
})
export class CardModule {}
