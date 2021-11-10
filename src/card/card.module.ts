import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";
import { CardResolver } from "@card/card.resolver";
import { CardSuggestionResolver } from "@card/card-suggestion.resolver";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";

import { DeckModule } from "@deck/deck.module";

@Module({
    imports: [TypeOrmModule.forFeature([Card, Text]), forwardRef(() => DeckModule)],
    providers: [CardService, CardResolver, CardSuggestionResolver],
    exports: [CardService],
})
export class CardModule {}
