import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChampionshipParticipantTeamNameColumn1639565397784 implements MigrationInterface {
    name = "AddChampionshipParticipantTeamNameColumn1639565397784";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` ADD \`teamName\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`teamName\``);
    }
}
