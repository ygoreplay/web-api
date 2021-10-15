import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckRecognizedDeckTag1634287953858 implements MigrationInterface {
    name = "AddDeckRecognizedDeckTag1634287953858";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` ADD \`recognizedDeckTags\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` DROP COLUMN \`recognizedDeckTags\``);
    }
}
