import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";

import { Field, Int, ObjectType } from "@nestjs/graphql";

import { Championship } from "@championship/models/championship.model";

@Entity()
@ObjectType()
export class ChampionshipParticipant {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
    public teamName!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public name!: string;

    @Field(() => [Int])
    @Column({ type: "simple-array" })
    public main!: number[];

    @Field(() => [Int])
    @Column({ type: "simple-array" })
    public extra!: number[];

    @Field(() => [Int])
    @Column({ type: "simple-array" })
    public side!: number[];

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (Many-to-One) - Championship => ChampionshipParticipant
    //
    @ManyToOne(() => Championship, championship => championship.participants)
    public championship!: Championship;

    @RelationId((entity: ChampionshipParticipant) => entity.championship)
    public championshipId!: Championship["id"];
}
