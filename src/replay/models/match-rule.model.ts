import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";

import Match from "src/replay/models/match.model";

@Entity({
    name: "match-rules",
})
export default class MatchRule extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Column({ type: "varchar", length: 255 })
    public banListDate: string; // 2021.07, etc.

    @Column({ type: "boolean" })
    public isTCG: boolean; // TCG 여부

    @Column({ type: "int" })
    public rule: number; // ???

    @Column({ type: "int" })
    public mode: number; // 0 => 싱글, 1 => 매치, 2 => 태그

    @Column({ type: "int" })
    public duelRule: number; // 마스터 룰 버전

    @Column({ type: "boolean" })
    public preventCheckDeck: boolean; // 덱 확인 여부

    @Column({ type: "boolean" })
    public preventShuffleDeck: boolean; // 덱 셔플 없는지 여부

    @Column({ type: "int" })
    public startLifePoint: number; // 시작 라이프 포인트

    @Column({ type: "int" })
    public startHand: number; // 시작 드로우 수

    @Column({ type: "int" })
    public drawCount: number; // 매 턴 드로우 수

    @Column({ type: "int" })
    public timeLimit: number; // 턴당 시간

    //
    // Relation (One-to-Many) - Match => MatchRule
    //
    @OneToMany(() => Match, match => match.matchRule)
    public matches!: Match[];

    @RelationId((entity: MatchRule) => entity.matches)
    public matchIds!: Match["id"][];
}
