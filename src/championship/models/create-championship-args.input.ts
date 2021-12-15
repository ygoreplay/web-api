import { Field, InputType, registerEnumType } from "@nestjs/graphql";

export enum ChampionshipType {
    Individual = "individual",
    Team = "team",
}

registerEnumType(ChampionshipType, { name: "ChampionshipType" });

@InputType()
export class CreateChampionshipArgs {
    @Field(() => String)
    public title!: string;

    @Field(() => ChampionshipType)
    public type!: ChampionshipType;

    @Field(() => String)
    public banList!: string;

    @Field(() => Boolean)
    public shareCardCount!: boolean;

    @Field(() => Boolean)
    public shareBanLists!: boolean;
}
