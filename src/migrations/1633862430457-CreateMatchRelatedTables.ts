import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMatchRelatedTables1633862430457 implements MigrationInterface {
    name = "CreateMatchRelatedTables1633862430457";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`rounds\` (\`id\` int NOT NULL AUTO_INCREMENT, \`no\` int NOT NULL, \`replayFilePath\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NULL, \`from\` varchar(255) NOT NULL, \`startedAt\` datetime NOT NULL, \`finishedAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`matchId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`match-rules\` (\`id\` int NOT NULL AUTO_INCREMENT, \`banListDate\` varchar(255) NOT NULL, \`isTCG\` tinyint NOT NULL, \`rule\` int NOT NULL, \`mode\` int NOT NULL, \`duelRule\` int NOT NULL, \`preventCheckDeck\` tinyint NOT NULL, \`preventShuffleDeck\` tinyint NOT NULL, \`startLifePoint\` int NOT NULL, \`startHand\` int NOT NULL, \`drawCount\` int NOT NULL, \`timeLimit\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`matches\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(255) NOT NULL, \`isRandomMatch\` tinyint NOT NULL DEFAULT 0, \`startedAt\` datetime NOT NULL, \`finishedAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`matchRuleId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`players\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` text CHARACTER SET "utf8mb4" COLLATE "utf8mb4_unicode_ci" NULL, \`ip\` varchar(255) NOT NULL, \`lang\` varchar(255) NOT NULL, \`pos\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`player-decks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`playerId\` int NULL, \`deckId\` int NULL, \`matchId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`decks\` (\`id\` int NOT NULL AUTO_INCREMENT, \`main\` text NOT NULL, \`side\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `CREATE TABLE \`matches_players_players\` (\`matchesId\` int NOT NULL, \`playersId\` int NOT NULL, INDEX \`IDX_41e304eb497cd0c916bf2938a6\` (\`matchesId\`), INDEX \`IDX_0b86e58b5265bf7b0644484ee7\` (\`playersId\`), PRIMARY KEY (\`matchesId\`, \`playersId\`)) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`rounds\` ADD CONSTRAINT \`FK_87c0e128fb4dd1a7b70f8f8b176\` FOREIGN KEY (\`matchId\`) REFERENCES \`matches\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`matches\` ADD CONSTRAINT \`FK_339df0e8b1a8be718f1c7a81a29\` FOREIGN KEY (\`matchRuleId\`) REFERENCES \`match-rules\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`player-decks\` ADD CONSTRAINT \`FK_163006288147b4b56ea4b99782c\` FOREIGN KEY (\`playerId\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`player-decks\` ADD CONSTRAINT \`FK_2c6ad4fbe7f1b5c1eaf4dd51ca0\` FOREIGN KEY (\`deckId\`) REFERENCES \`decks\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`player-decks\` ADD CONSTRAINT \`FK_07d7e1ae33cb7270032ddc585a4\` FOREIGN KEY (\`matchId\`) REFERENCES \`rounds\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE \`matches_players_players\` ADD CONSTRAINT \`FK_41e304eb497cd0c916bf2938a69\` FOREIGN KEY (\`matchesId\`) REFERENCES \`matches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE \`matches_players_players\` ADD CONSTRAINT \`FK_0b86e58b5265bf7b0644484ee7e\` FOREIGN KEY (\`playersId\`) REFERENCES \`players\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matches_players_players\` DROP FOREIGN KEY \`FK_0b86e58b5265bf7b0644484ee7e\``);
        await queryRunner.query(`ALTER TABLE \`matches_players_players\` DROP FOREIGN KEY \`FK_41e304eb497cd0c916bf2938a69\``);
        await queryRunner.query(`ALTER TABLE \`player-decks\` DROP FOREIGN KEY \`FK_07d7e1ae33cb7270032ddc585a4\``);
        await queryRunner.query(`ALTER TABLE \`player-decks\` DROP FOREIGN KEY \`FK_2c6ad4fbe7f1b5c1eaf4dd51ca0\``);
        await queryRunner.query(`ALTER TABLE \`player-decks\` DROP FOREIGN KEY \`FK_163006288147b4b56ea4b99782c\``);
        await queryRunner.query(`ALTER TABLE \`matches\` DROP FOREIGN KEY \`FK_339df0e8b1a8be718f1c7a81a29\``);
        await queryRunner.query(`ALTER TABLE \`rounds\` DROP FOREIGN KEY \`FK_87c0e128fb4dd1a7b70f8f8b176\``);
        await queryRunner.query(`DROP INDEX \`IDX_0b86e58b5265bf7b0644484ee7\` ON \`matches_players_players\``);
        await queryRunner.query(`DROP INDEX \`IDX_41e304eb497cd0c916bf2938a6\` ON \`matches_players_players\``);
        await queryRunner.query(`DROP TABLE \`matches_players_players\``);
        await queryRunner.query(`DROP TABLE \`decks\``);
        await queryRunner.query(`DROP TABLE \`player-decks\``);
        await queryRunner.query(`DROP TABLE \`players\``);
        await queryRunner.query(`DROP TABLE \`matches\``);
        await queryRunner.query(`DROP TABLE \`match-rules\``);
        await queryRunner.query(`DROP TABLE \`rounds\``);
    }
}
