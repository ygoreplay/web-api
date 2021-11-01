import { BaseEntity, Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import PlayerDeck from "@round/models/player-deck.model";
import Match from "@match/models/match.model";
import Round from "@round/models/round.model";
import { WinRateData } from "@deck/models/win-rate.model";

@ObjectType()
@Entity({
    name: "players",
})
export default class Player extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
    public name: string;

    @Field(() => String)
    @Column({ type: "varchar", length: 255 })
    public ip: string;

    @Field(() => String)
    @Column({ type: "varchar", length: 255 })
    public lang: string;

    @Field(() => Int)
    @Column({ type: "int" })
    public pos: number;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-Many) - Round => Player
    //
    @OneToMany(() => Round, wonRound => wonRound.winner)
    public wonRounds!: Round[];

    @RelationId((entity: Player) => entity.wonRounds)
    public wonRoundIds!: Round["id"][];

    //
    // Relation (One-to-Many) - Match => Player
    //
    @OneToMany(() => Match, wonMatch => wonMatch.winner)
    public wonMatches!: Match[];

    @RelationId((entity: Player) => entity.wonMatches)
    public wonMatcheIds!: Match["id"][];

    //
    // Relation (One-to-Many) - PlayerDeck => Player
    //
    @OneToMany(() => PlayerDeck, playerDeck => playerDeck.player)
    public playerDecks!: PlayerDeck[];

    @RelationId((entity: Player) => entity.playerDecks)
    public playerDeckIds!: PlayerDeck["id"][];

    //
    // Relation (Many-to-One) - Match => Player
    //
    @ManyToMany(() => Match, match => match.players)
    public match!: Match;

    @RelationId((entity: Player) => entity.match)
    public matchId!: Match["id"];

    //
    // Relation (One-to-Many) - WinRateData => Player
    //
    @OneToMany(() => WinRateData, winRateData => winRateData.player)
    public winRateData!: WinRateData[];

    @RelationId((entity: Player) => entity.winRateData)
    public winRateDataIds!: WinRateData["id"][];
}
