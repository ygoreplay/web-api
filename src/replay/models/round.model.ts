import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

import PlayerDeck from "src/replay/models/player-deck.model";
import Match from "src/replay/models/match.model";

@Entity({
    name: "rounds",
})
export default class Round extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Column({ type: "int" })
    public no: number;

    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
    public replayFilePath: string;

    @Column({ type: "varchar", length: 255 })
    public from: string;

    @Column({ type: "datetime" })
    public startedAt: Date;

    @Column({ type: "datetime" })
    public finishedAt: Date;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

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
    @OneToMany(() => PlayerDeck, playerDeck => playerDeck.match)
    public playerDecks!: PlayerDeck[];

    @RelationId((entity: Round) => entity.playerDecks)
    public playerDeckIds!: PlayerDeck["id"][];
}
