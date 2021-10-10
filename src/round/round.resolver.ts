import { Resolver } from "@nestjs/graphql";

import Round from "@round/models/round.model";

@Resolver(() => Round)
export class RoundResolver {}
