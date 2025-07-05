/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class DeletedAtColumn1751721592147 {

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionp" ADD "deletedAt" TIMESTAMP DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP DEFAULT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionp" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    }

}
