import { ReadStream } from "fs";

export async function readStreamIntoBuffer(stream: ReadStream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}
