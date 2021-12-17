import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { CardResolver } from "@card/card.resolver";
import { CardSuggestionResolver } from "@card/card-suggestion.resolver";
import { CardUpdateProcessor } from "@card/card-update.processor";
import { CardCropperResolver } from "@card/card-cropper.resolver";
import { CardCropperService } from "@card/card-cropper.service";
import { CardCropperController } from "@card/card-cropper.controller";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";
import { EdoCard } from "@card/models/edo-card.model";
import { EdoText } from "@card/models/edo-text.model";
import { CardCropperItem } from "@card/models/card-cropper-item.model";

import { DeckModule } from "@deck/deck.module";
import { BullModule } from "@nestjs/bull";

@Module({
    imports: [
        BullModule.registerQueue({
            name: "card-update",
        }),
        TypeOrmModule.forFeature([EdoCard, Card, Text, CardCropperItem, EdoText]),
        forwardRef(() => DeckModule),
    ],
    controllers: [CardCropperController],
    providers: [CardService, CardResolver, CardSuggestionResolver, CardUpdateProcessor, CardCropperResolver, CardCropperService],
    exports: [CardService, CardCropperService],
})
export class CardModule {}
