import { Controller, Get, Inject } from "@nestjs/common";
import { CardCropperService } from "@card/card-cropper.service";

@Controller("cropper")
export class CardCropperController {
    public constructor(@Inject(CardCropperService) private readonly cardCropperService: CardCropperService) {}

    @Get("/data")
    public async data() {
        return this.cardCropperService.findAll().then(rows => rows.map(row => ({ x: row.x, y: row.y, width: row.width, height: row.height, id: row.cardId })));
    }
}
