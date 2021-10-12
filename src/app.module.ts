import * as path from "path";
import { Request } from "express";

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";

import { ReplayModule } from "@replay/replay.module";
import { MatchModule } from "@match/match.module";
import { RoundModule } from "@round/round.module";
import { DeckModule } from "@deck/deck.module";
import { PlayerModule } from "@player/player.module";
import { MatchRuleModule } from "@match-rule/match-rule.module";

import * as config from "@root/ormconfig";
import { GraphQLContext } from "@root/types";

delete (config as any).entities;

@Module({
    imports: [
        TypeOrmModule.forRoot(config),
        GraphQLModule.forRootAsync({
            imports: [],
            useFactory: () => ({
                path: "/",
                installSubscriptionHandlers: true,
                autoSchemaFile:
                    process.env.NODE_ENV !== "production"
                        ? path.join(process.cwd(), "../ygoreplay-app", "./schema.gql")
                        : path.join(process.cwd(), "./schema.gql"),
                sortSchema: true,
                cors: {
                    credentials: true,
                    origin: true,
                },
                context: async ({ req }: { req: Request }): Promise<Omit<GraphQLContext, "req">> => {
                    return {
                        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP Address",
                    };
                },
            }),
            inject: [],
        }),
        ReplayModule,
        MatchModule,
        RoundModule,
        DeckModule,
        PlayerModule,
        MatchRuleModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
