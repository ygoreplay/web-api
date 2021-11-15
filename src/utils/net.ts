import * as fs from "fs-extra";
import fetch from "node-fetch";
import { Logger } from "@nestjs/common";

const networkingLogger = new Logger("Networking");

export async function downloadFileFromUrl(url: string, filePath: string) {
    const response = await fetch(url);
    const buffer = await new Promise<Buffer>(res => {
        const result: Buffer[] = [];
        const length = parseInt(response.headers.get("content-length"), 10);
        let transferred = 0;

        response.body.on("end", () => {
            networkingLogger.debug(`Downloading file ... (${((transferred / length) * 100).toFixed(0)}%)`);
            res(Buffer.concat(result));
        });
        response.body.on("data", (buffer: Buffer) => {
            transferred += buffer.length;

            if (result.length % 30 === 0) {
                networkingLogger.debug(`Downloading file ... (${((transferred / length) * 100).toFixed(0)}%)`);
            }
            result.push(buffer);
        });
    });

    await fs.writeFile(filePath, buffer);

    return filePath;
}
