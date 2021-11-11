import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Card } from "@card/models/Card.model";

@Entity({ name: "deck-title" })
@ObjectType()
export class DeckTitle {
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

    @RelationId((entity: DeckTitle) => entity.card)
    public cardId!: Card["id"];
}
