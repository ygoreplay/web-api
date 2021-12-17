import { Column, Entity, PrimaryColumn } from "typeorm";
import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity({ name: "edo-texts" })
export class EdoText {
    @Field(() => Int)
    @PrimaryColumn({ type: "int" })
    public id!: number;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public name!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public desc!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str1!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str2!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str3!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str4!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str5!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str6!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str7!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str8!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str9!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str10!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str11!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str12!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str13!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str14!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str15!: string;

    @Field(() => String)
    @Column({ type: "text", charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    public str16!: string;
}
