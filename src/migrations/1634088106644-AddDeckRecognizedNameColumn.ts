import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckRecognizedNameColumn1634088106644 implements MigrationInterface {
    name = "AddDeckRecognizedNameColumn1634088106644";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` ADD \`recognizedName\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` DROP COLUMN \`recognizedName\``);
    }
}
