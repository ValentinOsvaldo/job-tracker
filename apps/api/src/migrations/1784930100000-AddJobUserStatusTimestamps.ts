import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobUserStatusTimestamps1784930100000 implements MigrationInterface {
  name = 'AddJobUserStatusTimestamps1784930100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_user_statuses" ADD "applied_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_user_statuses" ADD "rejected_at" TIMESTAMP WITH TIME ZONE`,
    );
    // Backfill existing rows so pre-existing applied/rejected flags aren't
    // excluded from pipeline stats just because they predate this column.
    await queryRunner.query(
      `UPDATE "job_user_statuses" SET "applied_at" = "updated_at" WHERE "applied" = true`,
    );
    await queryRunner.query(
      `UPDATE "job_user_statuses" SET "rejected_at" = "updated_at" WHERE "rejected" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_user_statuses" DROP COLUMN "rejected_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_user_statuses" DROP COLUMN "applied_at"`,
    );
  }
}
