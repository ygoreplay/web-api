import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChampionshipTypeColumn1639398487250 implements MigrationInterface {
    name = "AddChampionshipTypeColumn1639398487250";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship\` ADD \`type\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship\` DROP COLUMN \`type\``);
    }
}
