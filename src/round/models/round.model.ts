import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import PlayerDeck from "@round/models/player-deck.model";
import Match from "@match/models/match.model";
import Player from "@player/models/player.model";

@ObjectType()
@Entity({
    name: "rounds",
})
export default class Round extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public no: number;

    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
    public replayFilePath: string;

    @Column({ type: "varchar", length: 255 })
    public from: string;

    @Field(() => Date)
    @Column({ type: "datetime" })
    public startedAt: Date;

    @Field(() => Date)
    @Column({ type: "datetime" })
    public finishedAt: Date;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (Many-to-One) - Player => Round
    //
    @ManyToOne(() => Player, winner => winner.wonRounds)
    public winner!: Player;

    @RelationId((entity: Round) => entity.winner)
    public winnerId!: Player["id"];

    //
    // Relation (Many-to-One) - Match => Round
    //
    @ManyToOne(() => Match, match => match.rounds)
    public match!: Match;

    @RelationId((entity: Round) => entity.match)
    public matchId!: Match["id"];

    //
    // Relation (One-to-Many) - PlayerDeck => Match
    //
    @OneToMany(() => PlayerDeck, playerDeck => playerDeck.match, { cascade: true })
    public playerDecks!: PlayerDeck[];

    @RelationId((entity: Round) => entity.playerDecks)
    public playerDeckIds!: PlayerDeck["id"][];
}
