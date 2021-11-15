import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteDeckTitleCardRelationType1636965079047 implements MigrationInterface {
    name = "DeleteDeckTitleCardRelationType1636965079047";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` DROP FOREIGN KEY \`FK_5af45f9d5168f891cd86315ade3\``);
        await queryRunner.query(`DROP INDEX \`REL_5af45f9d5168f891cd86315ade\` ON \`deck-title-card\``);
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` DROP COLUMN \`cardId\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` ADD \`cardId\` int NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_5af45f9d5168f891cd86315ade\` ON \`deck-title-card\` (\`cardId\`)`);
        await queryRunner.query(
            `ALTER TABLE \`deck-title-card\` ADD CONSTRAINT \`FK_5af45f9d5168f891cd86315ade3\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}
