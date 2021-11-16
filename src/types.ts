import { createCardCropperItemCheckerLoader, createCardIndexLoader } from "@card/card.loader";

export interface GraphQLContext {
    ip: string | string[];
    cardIndexLoader: ReturnType<typeof createCardIndexLoader>;
    cardCropperItemCheckerLoader: ReturnType<typeof createCardCropperItemCheckerLoader>;
}
