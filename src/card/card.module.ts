import { Module } from "@nestjs/common";

import { CardService } from "@card/card.service";
import { CardResolver } from "@card/card.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Card } from "@card/models/Card.model";
import { Text } from "@card/models/Text.model";

@Module({
    imports: [TypeOrmModule.forFeature([Card, Text])],
    providers: [CardService, CardResolver],
    exports: [CardService],
})
export class CardModule {}
