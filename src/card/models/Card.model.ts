import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import { Text } from "@card/models/Text.model";

@ObjectType()
@Entity({ name: "cards" })
export class Card extends BaseEntity {
    @Field(() => Int)
    @PrimaryColumn({ type: "int" })
    public id!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public ot!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public alias!: number;

    @Field(() => Int)
    @Column({ type: "bigint", name: "setcode" })
    public _setcode!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public type!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public atk!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public def!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public level!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public race!: number;

    @Field(() => Int)
    @Column({ type: "int" })
    public attribute!: number;

    @Field(() => Int)
    @Column({ type: "bigint" })
    public category!: number;

    @Field(() => Text)
    @OneToOne(() => Text, { eager: true })
    @JoinColumn({ name: "id" })
    public text!: Text;
}
