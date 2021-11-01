import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWinRateDataTable1635493660240 implements MigrationInterface {
    name = "CreateWinRateDataTable1635493660240";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`win-rate-data\` (\`id\` int NOT NULL AUTO_INCREMENT, \`deckName\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`won\` tinyint NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`win-rate-data\``);
    }
}
