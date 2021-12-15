import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeChampionshipParticipantTeamNameColumnNullable1639566481348 implements MigrationInterface {
    name = "ChangeChampionshipParticipantTeamNameColumnNullable1639566481348";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`championship_participant\` CHANGE \`teamName\` \`teamName\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` CHANGE \`teamName\` \`teamName\` text COLLATE "utf8mb4_unicode_ci" NOT NULL`);
    }
}
