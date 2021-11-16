import { Inject } from "@nestjs/common";
import { Resolver, Query, Args, Int, ResolveField, registerEnumType, Root, Subscription, Context } from "@nestjs/graphql";

import { CardService } from "@card/card.service";
import { CardCropperService } from "@card/card-cropper.service";
import { Card } from "@card/models/Card.model";
import { CardUsage } from "@card/models/card-usage.object";
import { CardSuggestion } from "@card/models/card-suggestion.object";

import { pubSub } from "@root/pubsub";
import { GraphQLContext } from "@root/types";
import { CardCropperItem } from "@card/models/card-cropper-item.model";

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
    public constructor(
        @Inject(CardService) private readonly cardService: CardService,
        @Inject(CardCropperService) private readonly cardCropperService: CardCropperService,
    ) {}

    @Query(() => [CardSuggestion])
    public async cardSuggestions(@Args("query", { type: () => String }) query: string, @Args("count", { type: () => Int }) count: number) {
        return this.cardService.suggestCards(query, count);
    }

    @Query(() => [CardUsage])
    public async topUsageCards(@Args("count", { type: () => Int }) count: number) {
        return this.cardService.getTopUsageCards(count);
    }

    @Query(() => Card, { nullable: true })
    public async card(@Args("id", { type: () => Int }) id: number) {
        return this.cardService.findById(id);
    }

    @Query(() => [Card])
    public async cards(@Args("ids", { type: () => [Int], nullable: true }) ids: number[] | null | undefined) {
        return this.cardService.findAll(ids);
    }

    @Query(() => Card, { nullable: true })
    public async indexedCard(@Args("index", { type: () => Int }) index: number) {
        return this.cardService.findByIndex(index);
    }

    @Query(() => Int)
    public async cardCount() {
        return this.cardService.count();
    }

    @Subscription(() => [CardUsage])
    public async cardUsageListUpdated() {
        return pubSub.asyncIterator("cardUsageListUpdated");
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

    @ResolveField(() => Boolean)
    public async hasCropperItem(@Root() card: Card, @Context() context: GraphQLContext) {
        return context.cardCropperItemCheckerLoader.load(card.id);
    }

    @ResolveField(() => CardCropperItem, { nullable: true })
    public async cropperItem(@Root() card: Card) {
        return this.cardCropperService.findByCardId(card.id);
    }
}
