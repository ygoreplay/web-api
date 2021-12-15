import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import { ChampionshipType } from "@championship/models/create-championship-args.input";
import { ChampionshipParticipant } from "@championship/models/championship-participant.model";

@Entity()
@ObjectType()
export class Championship {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public name!: string;

    @Field(() => ChampionshipType)
    @Column({ type: "varchar", length: 255 })
    public type!: ChampionshipType;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public banList!: string;

    @Field(() => Boolean)
    @Column({ type: "boolean", default: false })
    public shareCardCount!: boolean;

    @Field(() => Boolean)
    @Column({ type: "boolean", default: false })
    public shareBanLists!: boolean;

    @Field(() => String)
    @Column({ type: "varchar", length: 255 })
    public monitorUrlCode!: string;

    @Field(() => String)
    @Column({ type: "varchar", length: 255 })
    public joinUrlCode!: string;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-Many) - ChampionshipParticipant => Championship
    //
    @OneToMany(() => ChampionshipParticipant, participant => participant.championship)
    public participants!: ChampionshipParticipant[];

    @RelationId((entity: Championship) => entity.participants)
    public participantIds!: ChampionshipParticipant["id"][];
}
