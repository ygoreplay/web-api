import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@Entity()
@ObjectType()
export class Championship {
    @Field(() => Int)
    @PrimaryGeneratedColumn({ type: "int" })
    public id: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public name!: string;

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
}
