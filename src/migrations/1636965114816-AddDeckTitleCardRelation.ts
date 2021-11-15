import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeckTitleCardRelation1636965114816 implements MigrationInterface {
    name = "AddDeckTitleCardRelation1636965114816";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` ADD \`cardId\` int NULL`);
        await queryRunner.query(
            `ALTER TABLE \`deck-title-card\` ADD CONSTRAINT \`FK_5af45f9d5168f891cd86315ade3\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` DROP FOREIGN KEY \`FK_5af45f9d5168f891cd86315ade3\``);
        await queryRunner.query(`ALTER TABLE \`deck-title-card\` DROP COLUMN \`cardId\``);
    }
}
