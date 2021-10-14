import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { ObjectType } from "@nestjs/graphql";

import { Text } from "@card/models/Text.model";

@Entity({ name: "datas" })
@ObjectType()
export class YGOProCard extends BaseEntity {
    @PrimaryColumn({ type: "int" })
    public id!: number;

    @Column({ type: "int" })
    public ot!: number;

    @Column({ type: "int" })
    public alias!: number;

    @Column({ type: "int", name: "setcode" })
    public _setcode!: number;

    @Column({ type: "int" })
    public type!: number;

    @Column({ type: "int" })
    public atk!: number;

    @Column({ type: "int" })
    public def!: number;

    @Column({ type: "int" })
    public level!: number;

    @Column({ type: "int" })
    public race!: number;

    @Column({ type: "int" })
    public attribute!: number;

    @Column({ type: "int" })
    public category!: number;

    @OneToOne(() => Text, { eager: true })
    @JoinColumn({ name: "id" })
    public text!: Text;
}
