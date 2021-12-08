import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, RelationId } from "typeorm";
import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";

import { Text } from "@card/models/Text.model";
import { DeckTitleCard } from "@deck/models/deck-title-card.model";

export enum CardAttribute {
    None = 0,
    Earth = 1,
    Water = 2,
    Fire = 4,
    Wind = 8,
    Light = 16,
    Dark = 32,
    Divine = 64,
}
export enum CardRace {
    None = 0,
    Warrior = 1,
    SpellCaster = 2,
    Fairy = 4,
    Fiend = 8,
    Zombie = 16,
    Machine = 32,
    Aqua = 64,
    Pyro = 128,
    Rock = 256,
    WindBeast = 512,
    Plant = 1024,
    Insect = 2048,
    Thunder = 4096,
    Dragon = 8192,
    Beast = 16384,
    BeastWarrior = 32768,
    Dinosaur = 65536,
    Fish = 131072,
    SeaSerpent = 262144,
    Reptile = 524288,
    Psycho = 1048576,
    Divine = 2097152,
    CreatorGod = 4194304,
    Wyrm = 8388608,
    Cybers = 16777216,
}

registerEnumType(CardAttribute, { name: "CardAttribute" });
registerEnumType(CardRace, { name: "CardRace" });

@ObjectType()
@Entity({ name: "cards" })
export class Card extends BaseEntity {
    public get isSpell() {
        return Boolean(this.type & 0x2);
    }
    public get isTrap() {
        return Boolean(this.type & 0x4);
    }
    public get isContinuous() {
        return Boolean(this.type & 0x20000);
    }
    public get isEquip() {
        return Boolean(this.type & 0x40000);
    }
    public get isField() {
        return Boolean(this.type & 0x80000);
    }
    public get isCounter() {
        return Boolean(this.type & 0x100000);
    }
    public get isQuickPlay() {
        return Boolean(this.type & 0x10000);
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

    @Field(() => CardRace)
    @Column({ type: "int" })
    public race!: CardRace;

    @Field(() => CardAttribute)
    @Column({ type: "int" })
    public attribute!: CardAttribute;

    @Field(() => Int)
    @Column({ type: "bigint" })
    public category!: number;

    @Field(() => Text)
    @OneToOne(() => Text, { eager: true })
    @JoinColumn({ name: "id" })
    public text!: Text;

    //
    // Relation (One-to-Many) - DeckTitleCard => Card
    //
    @OneToMany(() => DeckTitleCard, deckTitleCard => deckTitleCard.card)
    public titleCards!: DeckTitleCard[];

    @RelationId((entity: Card) => entity.titleCards)
    public titledCardIds!: DeckTitleCard["id"][];
}
