import { Request } from "express";
import fetch from "node-fetch";
import * as FormData from "form-data";

import { Controller, HttpStatus, Inject, Logger, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { ReplayService } from "./replay.service";

@Controller("replay")
export class ReplayController {
    private readonly logger = new Logger(ReplayController.name);

    constructor(@Inject(ReplayService) private readonly replayService: ReplayService) {}

    @Post("/upload")
    @UseInterceptors(FileInterceptor("data"))
    public async uploadData(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
        if (!req.body || !file) {
            return { status: HttpStatus.NOT_FOUND };
        }

        try {
            if (process.env.NODE_ENV === "production") {
                const formData = new FormData();
                formData.append("data", file.buffer, {
                    filename: "data.bin",
                });

                await fetch("https://ygoreplay.jp.ngrok.io/replay/upload", {
                    method: "POST",
                    body: formData,
                    headers: formData.getHeaders(),
                });

                this.logger.log("Succeeded to relay replay data to the development server.");
            }
        } catch (e) {
            this.logger.error(`Failed to relay replay data to the development server: ${(e as Error).message}`);
        }

        const ipAddress = req.headers["x-real-ip"] || req.connection.remoteAddress;
        try {
            await this.replayService.registerReplayData(file.buffer, Array.isArray(ipAddress) ? ipAddress[0] : ipAddress);
        } catch (e) {
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: (e as Error).message };
        }

        return { status: HttpStatus.OK };
    }
}
