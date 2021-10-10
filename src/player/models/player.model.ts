import { BaseEntity, Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

import PlayerDeck from "@round/models/player-deck.model";
import Match from "@match/models/match.model";

@Entity({
    name: "players",
})
export default class Player extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
    public name: string;

    @Column({ type: "varchar", length: 255 })
    public ip: string;

    @Column({ type: "varchar", length: 255 })
    public lang: string;

    @Column({ type: "int" })
    public pos: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

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
}
