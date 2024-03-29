import * as path from "path";
import { Request } from "express";
import { ApolloServerPluginInlineTrace } from "apollo-server-core";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";

import { ReplayModule } from "@replay/replay.module";
import { MatchModule } from "@match/match.module";
import { RoundModule } from "@round/round.module";
import { DeckModule } from "@deck/deck.module";
import { PlayerModule } from "@player/player.module";
import { MatchRuleModule } from "@match-rule/match-rule.module";
import { StorageModule } from "@storage/storage.module";
import { ChampionshipModule } from "@championship/championship.module";

import { CardModule } from "@card/card.module";
import { CardService } from "@card/card.service";
import { CardCropperService } from "@card/card-cropper.service";
import { createCardCropperItemCheckerLoader, createCardIndexLoader } from "@card/card.loader";

import * as config from "@root/ormconfig";
import { GraphQLContext } from "@root/types";
delete (config as any).entities;

@Module({
    imports: [
        ScheduleModule.forRoot(),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "3005", 10),
            },
        }),
        TypeOrmModule.forRoot(config),
        GraphQLModule.forRootAsync({
            imports: [CardModule],
            useFactory: (cardService: CardService, cardCropperService: CardCropperService) => ({
                installSubscriptionHandlers: true,
                autoSchemaFile:
                    process.env.NODE_ENV !== "production" ? path.join(process.cwd(), "../web-app", "./schema.gql") : path.join(process.cwd(), "./schema.gql"),
                sortSchema: true,
                cors: {
                    credentials: true,
                    origin: true,
                },
                plugins: [ApolloServerPluginInlineTrace()],
                context: async ({ req }: { req: Request }): Promise<Omit<GraphQLContext, "req">> => {
                    return {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP Address",
                        cardIndexLoader: createCardIndexLoader(cardService),
                        cardCropperItemCheckerLoader: createCardCropperItemCheckerLoader(cardCropperService),
                    };
                },
            }),
            inject: [CardService, CardCropperService],
        }),
        ReplayModule,
        MatchModule,
        RoundModule,
        DeckModule,
        PlayerModule,
        MatchRuleModule,
        CardModule,
        StorageModule,
        ChampionshipModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
