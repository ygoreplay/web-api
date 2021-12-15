import * as _ from "lodash";
import { RawDeck } from "@utils/types";

export function getAllCardsFromRawDecks(rawDeck: RawDeck[]): number[] {
    return _.chain(rawDeck)
        .map(d => [...d.main, ...d.extra, ...d.side])
        .flattenDeep()
        .value();
}
