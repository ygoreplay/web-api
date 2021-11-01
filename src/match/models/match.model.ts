import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import Round from "@round/models/round.model";
import Player from "@player/models/player.model";
import MatchRule from "@match-rule/models/match-rule.model";
import { WinRateData } from "@deck/models/win-rate.model";

export enum MatchType {
    Normal = "normal",
    Athletic = "athletic",
    Entertain = "entertain",
}

registerEnumType(MatchType, { name: "MatchType" });

@ObjectType()
@Entity({
    name: "matches",
})
export default class Match extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => MatchType)
    @Column({ type: "varchar", length: 255 })
    public type: MatchType;

    @Field(() => Boolean)
    @Column({ type: "boolean", default: false })
    public isRandomMatch: boolean;

    @Field(() => Date)
    @Column({ type: "datetime" })
    public startedAt: Date;

    @Field(() => Date)
    @Column({ type: "datetime" })
    public finishedAt: Date;

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => Date)
    @UpdateDateColumn()
    public updatedAt: Date;

    //
    // Relation (Many-to-One) - Player => Match
    //
    @ManyToOne(() => Player, winner => winner.wonMatches)
    public winner!: Player | null;

    @RelationId((entity: Match) => entity.winner)
    public winnerId!: Player["id"] | null;

    //
    // Relation (One-to-Many) - Round => Match
    //
    @Field(() => [Round])
    @OneToMany(() => Round, round => round.match)
    public rounds!: Round[];

    @RelationId((entity: Match) => entity.rounds)
    public roundIds!: Round["id"][];

    //
    // Relation (One-to-Many) - Player => Match
    //
    @Field(() => [Player])
    @ManyToMany(() => Player, player => player.match)
    @JoinTable()
    public players!: Player[];

    @RelationId((entity: Match) => entity.players)
    public playerIds!: Player["id"][];

    //
    // Relation (Many-to-One) - MatchRule => Match
    //
    @Field(() => MatchRule)
    @ManyToOne(() => MatchRule, matchRule => matchRule.matches)
    public matchRule!: MatchRule;

    @RelationId((entity: Match) => entity.matchRule)
    public matchRuleId!: MatchRule["id"];

    //
    // Relation (One-to-Many) - WinRateData => Match
    //
    @OneToMany(() => WinRateData, winRateData => winRateData.match)
    public winRateData!: WinRateData[];

    @RelationId((entity: Match) => entity.winRateData)
    public winRateDataIds!: WinRateData["id"][];
}
