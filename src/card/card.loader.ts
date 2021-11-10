import * as DataLoader from "dataloader";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";

export function createCardIndexLoader(cardService: CardService) {
    return new DataLoader<Card["id"], number>(async cardIds => {
        const cards = await cardService.findAll();
        return cardIds.map(cardId => {
            return cards.findIndex(c => c.id === cardId);
        });
    });
}
