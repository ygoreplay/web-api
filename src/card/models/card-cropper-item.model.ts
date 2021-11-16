import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import { Card } from "@card/models/Card.model";

@Entity({ name: "cropper-items" })
@ObjectType()
export class CardCropperItem {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public x!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public y!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public width!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public height!: number;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-One) - Card => CropperItem
    //
    @OneToOne(() => Card)
    @JoinColumn()
    public card!: Card;

    @Field(() => Int)
    @RelationId((entity: CardCropperItem) => entity.card)
    public cardId!: Card["id"];
}
