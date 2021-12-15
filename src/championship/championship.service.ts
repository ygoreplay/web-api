import { nanoid } from "nanoid";
import { Repository } from "typeorm";

import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CardService } from "@card/card.service";

import { Championship } from "@championship/models/championship.model";
import { ChampionshipType, CreateChampionshipArgs } from "@championship/models/create-championship-args.input";
import { CreateChampionshipResult } from "@championship/models/create-championship-result.object";
import { SubmitParticipantsArgsInput } from "@championship/models/submit-participants-args.input";
import { ChampionshipParticipant } from "@championship/models/championship-participant.model";

import { ExecutionResult } from "@common/models/execution-result.object";

import { readStreamIntoBuffer } from "@utils/readStreamIntoBuffer";
import { parseDeckFileContent } from "@utils/parseDeckFileContent";
import { ParticipantDeck } from "@utils/types";
import { convertBanListDeclarationToMap } from "@utils/cards";
import * as _ from "lodash";
import { getAllCardsFromRawDecks } from "@utils/decks";

@Injectable()
export class ChampionshipService {
    public constructor(
        @Inject(CardService) private readonly cardService: CardService,
        @InjectRepository(Championship) private readonly championshipRepository: Repository<Championship>,
        @InjectRepository(ChampionshipParticipant) private readonly championshipParticipantRepository: Repository<ChampionshipParticipant>,
    ) {}

    public async createChampionship(data: CreateChampionshipArgs): Promise<CreateChampionshipResult> {
        let championship = this.championshipRepository.create();
        championship.name = data.title;
        championship.banList = data.banList;
        championship.shareBanLists = data.shareBanLists;
        championship.shareCardCount = data.shareCardCount;
        championship.monitorUrlCode = nanoid(16);
        championship.joinUrlCode = nanoid(16);
        championship.type = data.type;
        championship = await this.championshipRepository.save(championship);

        const result: CreateChampionshipResult = new CreateChampionshipResult();
        result.joinUrl = championship.joinUrlCode;
        result.monitorUrl = championship.monitorUrlCode;

        return result;
    }
    public async findChampionshipById(id: number) {
        return this.championshipRepository.findOne({
            where: {
                id,
            },
        });
    }
    public async findChampionshipByCode(id: string) {
        return await this.championshipRepository.findOne({
            where: [
                {
                    joinUrlCode: id,
                },
                {
                    monitorUrlCode: id,
                },
            ],
        });
    }
    public findParticipantsByIds(participantIds: ChampionshipParticipant["id"][]) {
        return this.championshipParticipantRepository.findByIds(participantIds);
    }

    public async submitChampionshipParticipants(
        championshipId: number,
        participantInputs: SubmitParticipantsArgsInput[],
        teamName: string | null,
    ): Promise<ExecutionResult> {
        const championship = await this.findChampionshipById(championshipId);
        if (!teamName && championship.type === ChampionshipType.Team) {
            return {
                errors: ["팀 이름 정보가 누락 되었습니다."],
                succeeded: false,
            };
        }

        const cards = await this.cardService.findAll();
        const participantDecks: ParticipantDeck[] = [];
        const errors: string[] = [];
        for (const p of participantInputs) {
            const file = await p.deckFile;
            const fileBuffer = await readStreamIntoBuffer(file.createReadStream());
            const deck = parseDeckFileContent(fileBuffer.toString(), cards);

            if (deck.main.length < 40 || deck.extra.length < 15 || deck.side.length < 15) {
                errors.push(
                    `'${p.name}' 참가자의 덱 매수가 올바르지 않습니다. (메인: ${deck.main.length}, 엑스트라: ${deck.extra.length}, 사이드: ${deck.side.length})`,
                );
            }

            participantDecks.push({ name: p.name, deck });
        }

        if (participantDecks.length !== 3 && championship.type === ChampionshipType.Team) {
            errors.push(`참가자 수가 맞지 않습니다. (필요: 3, 제공: ${participantDecks.length})`);
        } else if (participantDecks.length !== 1 && championship.type === ChampionshipType.Individual) {
            errors.push(`참가자 수가 맞지 않습니다. (필요: 1, 제공: ${participantDecks.length})`);
        }

        if (errors.length > 0) {
            return { errors, succeeded: false };
        }

        const cardMap = _.chain(cards).keyBy("id").mapValues().value();
        const banListMap = convertBanListDeclarationToMap(this.cardService.getBanList(championship.banList));
        for (const p of participantDecks) {
            const allCardIds = getAllCardsFromRawDecks([p.deck]);
            const uniqueCardIds = _.uniq(allCardIds).map(cardId => cardMap[cardId].id);
            const cardUsageCount = _.chain(allCardIds).countBy().value();

            for (const cardId of uniqueCardIds) {
                const usageCount = cardUsageCount[cardId];
                const maximumUsage = banListMap[cardId];

                if (usageCount > 3) {
                    errors.push(`'${p.name}' 참가자의 '${cardMap[cardId].text.name}' 카드 매수가 올바르지 않습니다. (${usageCount}장 사용됨)`);
                } else if (typeof maximumUsage === "number" && usageCount > maximumUsage) {
                    errors.push(
                        `'${p.name}' 참가자의 '${cardMap[cardId].text.name}' 카드 매수가 금제에 부합하지 않습니다. (${usageCount}장 사용됨, ${maximumUsage}장 사용 가능)`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            return { errors, succeeded: false };
        }

        if (championship.type === ChampionshipType.Team) {
            const allCards = getAllCardsFromRawDecks(participantDecks.map(pd => pd.deck));
            const cardUsageCount = _.chain(allCards).countBy().value();
            const uniqueCardIds = _.uniq(allCards).map(cardId => cardMap[cardId].id);
            for (const cardId of uniqueCardIds) {
                const usageCount = cardUsageCount[cardId];
                const maximumUsage = banListMap[cardId];

                // 금제가 설정된 카드 일 경우
                if (typeof maximumUsage === "number" && championship.shareBanLists && usageCount > maximumUsage) {
                    errors.push(
                        `전체 덱의 '${cardMap[cardId].text.name}' 카드 매수가 금제에 부합하지 않습니다. (${usageCount}장 사용됨, ${maximumUsage}장 사용 가능)`,
                    );
                } else if (championship.shareCardCount && usageCount > 3) {
                    errors.push(`전체 덱의 '${cardMap[cardId].text.name}' 카드 매수가 3장을 초과합니다. (${usageCount}장 사용됨, 3장 사용 가능)`);
                }
            }
        }

        if (errors.length > 0) {
            return {
                errors,
                succeeded: errors.length === 0,
            };
        }

        const result: ChampionshipParticipant[] = [];
        for (const p of participantDecks) {
            const participant = this.championshipParticipantRepository.create();
            participant.championship = championship;
            participant.name = p.name;
            participant.main = p.deck.main;
            participant.extra = p.deck.extra;
            participant.side = p.deck.side;

            if (championship.type === ChampionshipType.Team && teamName) {
                participant.teamName = teamName;
            }

            result.push(participant);
        }

        await this.championshipParticipantRepository.save(result);

        return {
            errors: [],
            succeeded: true,
        };
    }
}
