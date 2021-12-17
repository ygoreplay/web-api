import { RawDeck } from "@utils/types";

import { Card } from "@card/models/Card.model";
import { EdoCard } from "@card/models/edo-card.model";

export function parseDeckFileContent(content: string, cards: Card[], edoCards: EdoCard[]): RawDeck {
    const lines = content
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(line => line.trim());

    const result: RawDeck = {
        extra: [],
        main: [],
        side: [],
    };

    let side = false;
    for (const line of lines) {
        if (line.startsWith("!side")) {
            side = true;
            continue;
        }

        if (!/^[0-9]/.test(line)) {
            continue;
        }

        const cardId = parseInt(line, 10);
        const card = cards.find(card => card.id === cardId) || edoCards.find(card => card.id === cardId);
        if (side) {
            result.side.push(cardId);
        } else {
            if (card.isExtraCard) {
                result.extra.push(cardId);
            } else {
                result.main.push(cardId);
            }
        }
    }

    return result;
}
