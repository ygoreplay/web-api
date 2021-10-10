import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

import PlayerDeck from "@round/models/player-deck.model";

@Entity({
    name: "decks",
})
export default class Deck extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Column({ type: "simple-array" })
    public main: number[];

    @Column({ type: "simple-array" })
    public side: number[];

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-Many) - PlayerDeck => Deck
    //
    @OneToMany(() => PlayerDeck, playerDeck => playerDeck.deck)
    public playerDecks!: PlayerDeck[];

    @RelationId((entity: Deck) => entity.playerDecks)
    public playerDeckIds!: PlayerDeck["id"][];
}
