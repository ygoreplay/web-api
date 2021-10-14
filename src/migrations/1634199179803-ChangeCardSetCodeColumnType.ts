import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCardSetCodeColumnType1634199179803 implements MigrationInterface {
    name = "ChangeCardSetCodeColumnType1634199179803";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`setcode\``);
        await queryRunner.query(`ALTER TABLE \`cards\` ADD \`setcode\` bigint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cards\` DROP COLUMN \`setcode\``);
        await queryRunner.query(`ALTER TABLE \`cards\` ADD \`setcode\` int NOT NULL`);
    }
}
