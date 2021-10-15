import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckRecognizedTagColumn1634284467870 implements MigrationInterface {
    name = "AddDeckRecognizedTagColumn1634284467870";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` ADD \`recognizedTags\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` DROP COLUMN \`recognizedTags\``);
    }
}
