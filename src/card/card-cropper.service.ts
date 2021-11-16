import * as _ from "lodash";
import { Repository } from "typeorm";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardCropperItem } from "@card/models/card-cropper-item.model";
import { CardCropperDataInput } from "@card/models/card-cropper-data.input";

@Injectable()
export class CardCropperService {
    constructor(@InjectRepository(CardCropperItem) private readonly cardCropperItemRepository: Repository<CardCropperItem>) {}

    public findById(id: number) {
        return this.cardCropperItemRepository.findOne({
            where: {
                id,
            },
        });
    }
    public async findByCardId(id: number) {
        const result = await this.cardCropperItemRepository
            .createQueryBuilder("ci")
            .select("`ci`.`id`")
            .where("`ci`.`cardId` = :id", { id })
            .getRawOne<{ id: string }>();

        if (!result) {
            return null;
        }

        return this.cardCropperItemRepository.findOne({
            where: {
                id: result.id,
            },
        });
    }
    public async findByCardIds(ids: number[]) {
        const existingIds = await this.cardCropperItemRepository
            .createQueryBuilder("ci")
            .select("`ci`.`id`")
            .where("`ci`.`cardId` IN (:ids)", { ids })
            .getRawMany<{ id: string }>()
            .then(rows => rows.map(row => row.id));

        return this.cardCropperItemRepository.findByIds(existingIds);
    }
    public async has(ids: ReadonlyArray<number>) {
        const result = await this.cardCropperItemRepository
            .createQueryBuilder("ci")
            .select("`ci`.`id`")
            .addSelect("`ci`.`cardId`")
            .where("`ci`.`cardId` IN (:ids)", { ids })
            .getRawMany<{
                id: string;
                cardId: string;
            }>()
            .then(rows => {
                return rows.map(row => ({ id: parseInt(row.id, 10), cardId: parseInt(row.cardId, 10) }));
            })
            .then(rows => {
                return _.chain(rows)
                    .keyBy(c => c.cardId.toString())
                    .mapValues()
                    .value();
            });

        return ids.map(cardId => {
            return Boolean(result[cardId.toString()]);
        });
    }

    public async save(inputs: CardCropperDataInput[]) {
        const existingData = await this.findByCardIds(inputs.map(item => item.cardId));
        const existingDataMap = _.chain(existingData).keyBy("cardId").mapValues().value();
        const convertedData = inputs.map(input => {
            let data = existingDataMap[input.cardId];
            if (!data) {
                data = this.cardCropperItemRepository.create();
                data.card = { id: input.cardId } as any;
            }

            data.x = input.x;
            data.y = input.y;
            data.width = input.width;
            data.height = input.height;
            return data;
        });

        return this.cardCropperItemRepository.save(convertedData);
    }
}
