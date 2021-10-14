import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckExtraColumn1634200850106 implements MigrationInterface {
    name = "AddDeckExtraColumn1634200850106";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` ADD \`extra\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`decks\` DROP COLUMN \`extra\``);
    }
}
