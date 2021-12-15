import { Inject } from "@nestjs/common";
import { Args, Int, Mutation, Query, ResolveField, Resolver, Root } from "@nestjs/graphql";

import { ChampionshipService } from "@championship/championship.service";

import { Championship } from "@championship/models/championship.model";
import { CreateChampionshipResult } from "@championship/models/create-championship-result.object";
import { CreateChampionshipArgs } from "@championship/models/create-championship-args.input";
import { SubmitParticipantsArgsInput } from "@championship/models/submit-participants-args.input";
import { ChampionshipParticipant } from "@championship/models/championship-participant.model";

import { ExecutionResult } from "@common/models/execution-result.object";

@Resolver(() => Championship)
export class ChampionshipResolver {
    public constructor(@Inject(ChampionshipService) private readonly championshipService: ChampionshipService) {}

    @Query(() => Championship, { nullable: true })
    public async championship(@Args("id", { type: () => String }) id: string) {
        return this.championshipService.findChampionshipByCode(id);
    }

    @Mutation(() => ExecutionResult)
    public async submitChampionshipParticipants(
        @Args("championshipId", { type: () => Int }) championshipId: number,
        @Args("participants", { type: () => [SubmitParticipantsArgsInput] }) participants: SubmitParticipantsArgsInput[],
    ) {
        return this.championshipService.submitChampionshipParticipants(championshipId, participants);
    }

    @Mutation(() => CreateChampionshipResult)
    public async createChampionship(@Args("data", { type: () => CreateChampionshipArgs }) data: CreateChampionshipArgs) {
        return this.championshipService.createChampionship(data);
    }

    @ResolveField(() => [ChampionshipParticipant])
    public async participants(@Root() championship: Championship) {
        return this.championshipService.findParticipantsByIds(championship.participantIds);
    }
}
