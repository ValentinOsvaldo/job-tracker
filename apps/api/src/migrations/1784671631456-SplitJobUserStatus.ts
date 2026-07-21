import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitJobUserStatus1784671631456 implements MigrationInterface {
    name = 'SplitJobUserStatus1784671631456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."job_user_statuses_interest_enum" AS ENUM('liked', 'disliked')`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD "interest" "public"."job_user_statuses_interest_enum"`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD "applied" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD "rejected" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "interest" = "status"::text::"public"."job_user_statuses_interest_enum" WHERE "status" IN ('liked', 'disliked')`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "applied" = true WHERE "status" = 'applied'`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "rejected" = true WHERE "status" = 'rejected'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5a8cf8913c796be22121ed622"`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_user_statuses_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_37e4f0d0b1c4d2e5c9d3f0a1b2c" ON "job_user_statuses" ("user_id", "interest")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_37e4f0d0b1c4d2e5c9d3f0a1b2c"`);
        await queryRunner.query(`CREATE TYPE "public"."job_user_statuses_status_enum" AS ENUM('liked', 'disliked', 'applied', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD "status" "public"."job_user_statuses_status_enum"`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "status" = "interest"::text::"public"."job_user_statuses_status_enum" WHERE "interest" IS NOT NULL`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "status" = 'applied' WHERE "status" IS NULL AND "applied" = true`);
        await queryRunner.query(`UPDATE "job_user_statuses" SET "status" = 'rejected' WHERE "status" IS NULL AND "rejected" = true`);
        await queryRunner.query(`DELETE FROM "job_user_statuses" WHERE "status" IS NULL`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP COLUMN "rejected"`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP COLUMN "applied"`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP COLUMN "interest"`);
        await queryRunner.query(`DROP TYPE "public"."job_user_statuses_interest_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_f5a8cf8913c796be22121ed622" ON "job_user_statuses" ("user_id", "status")`);
    }

}
