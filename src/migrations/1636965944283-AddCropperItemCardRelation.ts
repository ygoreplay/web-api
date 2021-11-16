import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCropperItemCardRelation1636965944283 implements MigrationInterface {
    name = "AddCropperItemCardRelation1636965944283";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cropper-items\` ADD \`cardId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`cropper-items\` ADD UNIQUE INDEX \`IDX_ffefcb2001d06c7764f869e955\` (\`cardId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_ffefcb2001d06c7764f869e955\` ON \`cropper-items\` (\`cardId\`)`);
        await queryRunner.query(
            `ALTER TABLE \`cropper-items\` ADD CONSTRAINT \`FK_ffefcb2001d06c7764f869e9557\` FOREIGN KEY (\`cardId\`) REFERENCES \`cards\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cropper-items\` DROP FOREIGN KEY \`FK_ffefcb2001d06c7764f869e9557\``);
        await queryRunner.query(`DROP INDEX \`REL_ffefcb2001d06c7764f869e955\` ON \`cropper-items\``);
        await queryRunner.query(`ALTER TABLE \`cropper-items\` DROP INDEX \`IDX_ffefcb2001d06c7764f869e955\``);
        await queryRunner.query(`ALTER TABLE \`cropper-items\` DROP COLUMN \`cardId\``);
    }
}
