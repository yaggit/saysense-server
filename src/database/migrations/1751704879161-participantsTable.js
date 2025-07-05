/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class ParticipantsTable1751704879161 {
  async up(queryRunner) {
    await queryRunner.query(`
          CREATE TABLE "participants" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "sessionId" uuid,
            "name" character varying NOT NULL,
            "role" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participants_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "participants"
      ADD CONSTRAINT "FK_participants_session"
      FOREIGN KEY ("sessionId") REFERENCES "sessionp"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sessionp"
      ADD COLUMN "tags" text[]
    `);

    await queryRunner.query(`
      ALTER TABLE "sessionp"
      ADD COLUMN "summary" text
    `);

    await queryRunner.query(`
      ALTER TABLE "sessionp"
      ADD COLUMN "sentiment" double precision
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_segments"
      ADD COLUMN "confidence" double precision
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_segments"
      ADD COLUMN "highlights" text[]
    `);
    
  }

  async down(queryRunner) {
    await queryRunner.query(
      `ALTER TABLE "transcript_segments" DROP COLUMN "highlights"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transcript_segments" DROP COLUMN "confidence"`,
    );

    await queryRunner.query(`ALTER TABLE "sessionp" DROP COLUMN "sentiment"`);
    await queryRunner.query(`ALTER TABLE "sessionp" DROP COLUMN "summary"`);
    await queryRunner.query(`ALTER TABLE "sessionp" DROP COLUMN "tags"`);

    await queryRunner.query(
      `ALTER TABLE "participants" DROP CONSTRAINT "FK_participants_session"`,
    );
    await queryRunner.query(`DROP TABLE "participants"`);
  }
};
