import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
    JoinTable,
} from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@replay/models/match-rule.model";

@ObjectType()
@Entity({
    name: "matches",
})
export default class Match extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Column({ type: "varchar", length: 255 })
    public type: "normal" | "athletic" | "entertain";

    @Column({ type: "boolean", default: false })
    public isRandomMatch: boolean;

    @Column({ type: "datetime" })
    public startedAt: Date;

    @Column({ type: "datetime" })
    public finishedAt: Date;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (One-to-Many) - Round => Match
    //
    @OneToMany(() => Round, round => round.match)
    public rounds!: Round[];

    @RelationId((entity: Match) => entity.rounds)
    public roundIds!: Round["id"][];

    //
    // Relation (One-to-Many) - Player => Match
    //
    @ManyToMany(() => Player, player => player.match)
    @JoinTable()
    public players!: Player[];

    @RelationId((entity: Match) => entity.players)
    public playerIds!: Player["id"][];

    //
    // Relation (Many-to-One) - MatchRule => Match
    //
    @ManyToOne(() => MatchRule, matchRule => matchRule.matches)
    public matchRule!: MatchRule;

    @RelationId((entity: Match) => entity.matchRule)
    public matchRuleId!: MatchRule["id"];
}
