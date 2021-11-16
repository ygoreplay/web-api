import * as DataLoader from "dataloader";

import { CardService } from "@card/card.service";
import { Card } from "@card/models/Card.model";
import { CardCropperService } from "@card/card-cropper.service";

export function createCardIndexLoader(cardService: CardService) {
    return new DataLoader<Card["id"], number>(async cardIds => {
        const cards = await cardService.findAll();
        return cardIds.map(cardId => {
            return cards.findIndex(c => c.id === cardId);
        });
    });
}

export function createCardCropperItemCheckerLoader(cardCropperService: CardCropperService) {
    return new DataLoader<Card["id"], boolean>(async cardIds => {
        return await cardCropperService.has(cardIds);
    });
}
