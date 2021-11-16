import { Inject, Injectable } from "@nestjs/common";
import { Args, Int, Mutation, Query } from "@nestjs/graphql";

import { CardCropperService } from "@card/card-cropper.service";

import { CardCropperItem } from "@card/models/card-cropper-item.model";
import { CardCropperDataInput } from "@card/models/card-cropper-data.input";

@Injectable()
export class CardCropperResolver {
    public constructor(@Inject(CardCropperService) private readonly cardCropperService: CardCropperService) {}

    @Query(() => CardCropperItem, { nullable: true })
    public cropperItem(@Args("id", { type: () => Int }) id: number) {
        return this.cardCropperService.findById(id);
    }

    @Mutation(() => [CardCropperItem])
    public saveCropperData(@Args("input", { type: () => [CardCropperDataInput] }) input: CardCropperDataInput[]) {
        return this.cardCropperService.save(input);
    }
}
