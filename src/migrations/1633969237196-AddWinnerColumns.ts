import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinnerColumns1633969237196 implements MigrationInterface {
    name = "AddWinnerColumns1633969237196";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rounds\` ADD \`winnerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matches\` ADD \`winnerId\` int NULL`);
        await queryRunner.query(
            `ALTER TABLE \`rounds\` ADD CONSTRAINT \`FK_dd3932b3737217ba32bce902947\` FOREIGN KEY (\`winnerId\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_eb5e9984be5b3bd5c8e3ef2d9ec\` FOREIGN KEY (\`winnerId\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_eb5e9984be5b3bd5c8e3ef2d9ec\``);
        await queryRunner.query(`ALTER TABLE \`rounds\` DROP FOREIGN KEY \`FK_dd3932b3737217ba32bce902947\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP COLUMN \`winnerId\``);
        await queryRunner.query(`ALTER TABLE \`rounds\` DROP COLUMN \`winnerId\``);
    }
}
