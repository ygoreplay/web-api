import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChampionshipTable1639395150853 implements MigrationInterface {
    name = "AddChampionshipTable1639395150853";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`championship\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`banList\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`shareCardCount\` tinyint NOT NULL DEFAULT 0, \`shareBanLists\` tinyint NOT NULL DEFAULT 0, \`monitorUrlCode\` varchar(255) NOT NULL, \`joinUrlCode\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`championship\``);
    }
}
