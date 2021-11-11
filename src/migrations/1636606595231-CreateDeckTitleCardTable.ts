import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeckTitleCardTable1636606595231 implements MigrationInterface {
    name = "CreateDeckTitleCardTable1636606595231";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`deck-title-card\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`cardId\` int NULL, UNIQUE INDEX \`REL_5af45f9d5168f891cd86315ade\` (\`cardId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`deck-title-card\` ADD CONSTRAINT \`FK_5af45f9d5168f891cd86315ade3\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` DROP FOREIGN KEY \`FK_5af45f9d5168f891cd86315ade3\``);
        await queryRunner.query(`DROP INDEX \`REL_5af45f9d5168f891cd86315ade\` ON \`deck-title-card\``);
        await queryRunner.query(`DROP TABLE \`deck-title-card\``);
    }
}
