import { Injectable } from "@nestjs/common";
import * as aws from "aws-sdk";
import * as stream from "stream";

@Injectable()
export class StorageService {
    private s3: aws.S3;

    public constructor() {
        aws.config.update({ region: "ap-northeast-2" });
        this.s3 = new aws.S3({
            apiVersion: "2006-03-01",
        });
    }

    public async checkBucketExists(bucketName: string) {
        try {
            await this.s3
                .headBucket({
                    Bucket: `ygoreplay-${bucketName}`,
                })
                .promise();

            return true;
        } catch (error) {
            if ((error as Error & { statusCode: number }).statusCode === 404) {
                return false;
            }

            throw error;
        }
    }
    public async ensureBucket(bucketName: string) {
        if (await this.checkBucketExists(bucketName)) {
            return;
        }

        await this.s3
            .createBucket({
                Bucket: `ygoreplay-${bucketName}`,
            })
            .promise();
    }

    public async upload(buffer: Buffer, filePath: string, bucketName: string) {
        const writeStream = new stream.PassThrough();
        const uploadPromise = this.s3
            .upload({
                Bucket: `ygoreplay-${bucketName}`,
                Key: filePath,
                Body: writeStream,
                ACL: "public-read",
            })
            .promise();

        stream.Readable.from(buffer).pipe(writeStream);

        return await uploadPromise;
    }
}
