import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinRateDataDeckTagsColumn1635737780547 implements MigrationInterface {
    name = "AddWinRateDataDeckTagsColumn1635737780547";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`win-rate-data\` ADD \`deckTags\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`win-rate-data\` DROP COLUMN \`deckTags\``);
    }
}
