import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";

import Match from "@match/models/match.model";
import Player from "@player/models/player.model";

@ObjectType()
@Entity({
    name: "win-rate-data",
})
export class WinRateData extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public deckName!: string;

    @Field(() => Boolean)
    @Column({ type: "boolean" })
    public won!: boolean;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    //
    // Relation (Many-to-One) - Match => WinRateData
    //
    @ManyToOne(() => Match, match => match.winRateData)
    public match!: Match;

    @RelationId((entity: WinRateData) => entity.match)
    public matchId!: Match["id"];

    //
    // Relation (Many-to-One) - Player => WinRateData
    //
    @ManyToOne(() => Player, player => player.winRateData)
    public player!: Player;

    @RelationId((entity: WinRateData) => entity.player)
    public playerId!: Player["id"];
}
