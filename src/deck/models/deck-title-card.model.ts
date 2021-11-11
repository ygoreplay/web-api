import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Card } from "@card/models/Card.model";

@Entity({ name: "deck-title-card" })
@ObjectType()
export class DeckTitleCard {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id!: number;

    @Field(() => String)
    @Column({ type: "varchar", length: 255, charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public name!: string;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-One) - Card => DeckTitle
    //
    @OneToOne(() => Card)
    @JoinColumn()
    public card!: Card;

    @Field(() => Int)
    @RelationId((entity: DeckTitleCard) => entity.card)
    public cardId!: Card["id"];
}
