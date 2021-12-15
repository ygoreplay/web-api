import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChampionshipParticipantTable1639551472877 implements MigrationInterface {
    name = "CreateChampionshipParticipantTable1639551472877";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`championship_participant\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`championshipId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`championship_participant\` ADD CONSTRAINT \`FK_b3be2e8c332b0a9478901a128bb\` FOREIGN KEY (\`championshipId\`) REFERENCES \`championship\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP FOREIGN KEY \`FK_b3be2e8c332b0a9478901a128bb\``);
        await queryRunner.query(`DROP TABLE \`championship_participant\``);
    }
}
