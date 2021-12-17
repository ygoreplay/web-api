import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEdoProCardTables1639720362369 implements MigrationInterface {
    name = "CreateEdoProCardTables1639720362369";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`edo-texts\` (\`id\` int NOT NULL, \`name\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`desc\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str1\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str2\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str3\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str4\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str5\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str6\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str7\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str8\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str9\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str10\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str11\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str12\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str13\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str14\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str15\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, \`str16\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`edo-cards\` (\`id\` int NOT NULL, \`ot\` int NOT NULL, \`alias\` int NOT NULL, \`setcode\` bigint NOT NULL, \`type\` int NOT NULL, \`atk\` int NOT NULL, \`def\` int NOT NULL, \`level\` int NOT NULL, \`race\` int NOT NULL, \`attribute\` int NOT NULL, \`category\` bigint NOT NULL, UNIQUE INDEX \`REL_c7ea6ce06120b45e0d51f4e11a\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`edo-cards\` ADD CONSTRAINT \`FK_c7ea6ce06120b45e0d51f4e11aa\` FOREIGN KEY (\`id\`) REFERENCES \`edo-texts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`edo-cards\` DROP FOREIGN KEY \`FK_c7ea6ce06120b45e0d51f4e11aa\``);
        await queryRunner.query(`DROP INDEX \`REL_c7ea6ce06120b45e0d51f4e11a\` ON \`edo-cards\``);
        await queryRunner.query(`DROP TABLE \`edo-cards\``);
        await queryRunner.query(`DROP TABLE \`edo-texts\``);
    }
}
