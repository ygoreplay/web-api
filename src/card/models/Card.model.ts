import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import { Text } from "@card/models/Text.model";

@ObjectType()
@Entity({ name: "cards" })
export class Card extends BaseEntity {
    public get isSpell() {
        return Boolean(this.type & 0x2);
    }
    public get isTrap() {
        return Boolean(this.type & 0x4);
    }
    public get isMonster() {
        return Boolean(this.type & 0x1);
    }
    public get isSynchro() {
        return Boolean(this.type & 0x2000);
    }
    public get isXYZ() {
        return Boolean(this.type & 0x800000);
    }
    public get isFusion() {
        return Boolean(this.type & 0x40);
    }
    public get isLink() {
        return Boolean(this.type & 0x4000000);
    }
    public get isPendulum() {
        return Boolean(this.type & 0x1000000);
    }
    public get isRitual() {
        return Boolean(this.type & 0x80);
    }
    public get isExtraCard() {
        return this.isMonster && (this.isFusion || this.isSynchro || this.isXYZ || this.isLink);
    }

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
