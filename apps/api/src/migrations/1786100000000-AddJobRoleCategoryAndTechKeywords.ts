import { MigrationInterface, QueryRunner } from 'typeorm';
import { categorizeJobRole } from '../jobs/utils/role-category';
import { extractTechKeywords } from '../jobs/utils/tech-keywords';

export class AddJobRoleCategoryAndTechKeywords1786100000000 implements MigrationInterface {
  name = 'AddJobRoleCategoryAndTechKeywords1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_role_category_enum" AS ENUM('frontend', 'backend', 'fullstack', 'mobile', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "role_category" "public"."jobs_role_category_enum" NOT NULL DEFAULT 'other'`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD "tech_keywords" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_role_category" ON "jobs" ("role_category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_tech_keywords" ON "jobs" USING GIN ("tech_keywords")`,
    );

    await this.backfillExistingJobs(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_tech_keywords"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_role_category"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "tech_keywords"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "role_category"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_role_category_enum"`);
  }

  /** Computes role_category/tech_keywords for every job already in the
   * table using the same pure classifiers applied at ingest time, so
   * filtering/stats are complete for historical postings, not just new
   * ones. Runs as individual UPDATEs (rather than a single bulk UNNEST)
   * because tech_keywords arrays are jagged across rows, which a
   * multi-dimensional Postgres array parameter can't represent. */
  private async backfillExistingJobs(queryRunner: QueryRunner): Promise<void> {
    const jobs = (await queryRunner.query(
      `SELECT "id", "title", "description" FROM "jobs"`,
    )) as { id: string; title: string; description: string | null }[];

    for (const job of jobs) {
      const roleCategory = categorizeJobRole(job.title, job.description);
      const techKeywords = extractTechKeywords(job.title, job.description);

      await queryRunner.query(
        `UPDATE "jobs" SET "role_category" = $1, "tech_keywords" = $2 WHERE "id" = $3`,
        [roleCategory, techKeywords, job.id],
      );
    }
  }
}
