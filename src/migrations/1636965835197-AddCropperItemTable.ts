import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCropperItemTable1636965835197 implements MigrationInterface {
    name = "AddCropperItemTable1636965835197";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`cropper-items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`x\` int NOT NULL, \`y\` int NOT NULL, \`width\` int NOT NULL, \`height\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`cropper-items\``);
    }
}
