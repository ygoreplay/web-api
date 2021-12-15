import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChampionshipParticipantDateColumns1639558585417 implements MigrationInterface {
    name = "AddChampionshipParticipantDateColumns1639558585417";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(
            `ALTER TABLE \`championship_participant\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`championship_participant\` DROP COLUMN \`createdAt\``);
    }
}
