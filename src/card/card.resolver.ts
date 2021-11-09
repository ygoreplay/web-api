import { Inject } from "@nestjs/common";
import { Resolver, Query, Args, Int, ResolveField, registerEnumType, Root } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";
import { CardUsage } from "@card/models/card-usage.object";

enum CardType {
    Monster = "monster",
    Spell = "Spell",
    Trap = "Trap",
}

enum MonsterCardType {
    Normal = "normal",
    Effect = "effect",
    Fusion = "fusion",
    Ritual = "ritual",
    Synchro = "synchro",
    Xyz = "xyz",
    Pendulum = "pendulum",
    Link = "link",
}

registerEnumType(CardType, { name: "CardType" });
registerEnumType(MonsterCardType, { name: "MonsterCardType" });

@Resolver(() => Card)
export class CardResolver {
    public constructor(@Inject(CardService) private readonly cardService: CardService) {}

    @Query(() => [CardUsage])
    public async topUsageCards(@Args("count", { type: () => Int }) count: number) {
        return this.cardService.getTopUsageCards(count);
    }

    @Query(() => Card, { nullable: true })
    public async card(@Args("id", { type: () => Int }) id: number) {
        return this.cardService.findById(id);
    }

    @Query(() => Card, { nullable: true })
    public async indexedCard(@Args("index", { type: () => Int }) index: number) {
        return this.cardService.findByIndex(index);
    }

    @Query(() => Int)
    public async cardCount() {
        return this.cardService.count();
    }

    @ResolveField(() => [MonsterCardType])
    public async monsterType(@Root() card: Card) {
        const result: MonsterCardType[] = [];
        if (card.isFusion) {
            result.push(MonsterCardType.Fusion);
        }

        if (card.isSynchro) {
            result.push(MonsterCardType.Synchro);
        }

        if (card.isXYZ) {
            result.push(MonsterCardType.Xyz);
        }

        if (card.isPendulum) {
            result.push(MonsterCardType.Pendulum);
        }

        if (card.isLink) {
            result.push(MonsterCardType.Link);
        }

        return result;
    }

    @ResolveField(() => CardType)
    public async type(@Root() card: Card) {
        if (card.isMonster) {
            return CardType.Monster;
        }

        if (card.isTrap) {
            return CardType.Trap;
        }

        return CardType.Spell;
    }
}
