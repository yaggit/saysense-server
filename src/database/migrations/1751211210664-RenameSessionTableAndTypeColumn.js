/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class RenameSessionTableAndTypeColumn1751211210664 {

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessions" RENAME TO "sessionp"`);
        await queryRunner.query(`ALTER TABLE "sessionp" RENAME COLUMN "type" TO "session_type"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionp" RENAME COLUMN "session_type" TO "type"`);
        await queryRunner.query(`ALTER TABLE "sessionp" RENAME TO "sessions"`);
    }

}
