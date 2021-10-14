import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import PlayerDeck from "@round/models/player-deck.model";

@ObjectType()
@Entity({
    name: "decks",
})
export default class Deck extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => [Int])
    @Column({ type: "simple-array", name: "main" })
    public mainIds: number[];

    @Field(() => [Int])
    @Column({ type: "simple-array", name: "extra" })
    public extraIds: number[];

    @Field(() => [Int])
    @Column({ type: "simple-array", name: "side" })
    public sideIds: number[];

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public recognizedName!: string;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
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
