import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckRecognizedNameColumn1634134972265 implements MigrationInterface {
    name = "AddDeckRecognizedNameColumn1634134972265";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` ADD \`recognizedName\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` DROP COLUMN \`recognizedName\``);
    }
}
