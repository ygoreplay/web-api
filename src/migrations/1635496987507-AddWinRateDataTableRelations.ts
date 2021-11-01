import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWinRateDataTableRelations1635496987507 implements MigrationInterface {
    name = "AddWinRateDataTableRelations1635496987507";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            ADD \`matchId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            ADD \`playerId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            ADD CONSTRAINT \`FK_2dfdf21d8469ad5532f753b96f1\` FOREIGN KEY (\`matchId\`) REFERENCES \`matches\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            ADD CONSTRAINT \`FK_2760e0e915c956c6983a5d418ef\` FOREIGN KEY (\`playerId\`) REFERENCES \`players\` (\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            DROP FOREIGN KEY \`FK_2760e0e915c956c6983a5d418ef\``);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            DROP FOREIGN KEY \`FK_2dfdf21d8469ad5532f753b96f1\``);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            DROP COLUMN \`playerId\``);
        await queryRunner.query(`ALTER TABLE \`win-rate-data\`
            DROP COLUMN \`matchId\``);
    }
}
