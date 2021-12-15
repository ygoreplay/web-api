import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChampionshipParticipantDeckColumns1639553650175 implements MigrationInterface {
    name = "AddChampionshipParticipantDeckColumns1639553650175";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` ADD \`main\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`championship_participant\` ADD \`extra\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`championship_participant\` ADD \`side\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`side\``);
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`extra\``);
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`main\``);
    }
}
