import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1784661675648 implements MigrationInterface {
    name = 'InitSchema1784661675648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_source_enum" AS ENUM('linkedin', 'indeed')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "company" character varying(255), "location" character varying(255), "description" text, "url" character varying(500) NOT NULL, "source" "public"."jobs_source_enum" NOT NULL, "date_posted" date, "job_type" character varying(50), "salary_min" integer, "salary_max" integer, "salary_interval" character varying(20), "scraped_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_9aff154c36c133be0cf9d64d767" UNIQUE ("url"), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying(255) NOT NULL, "cv_text" text, "cv_filename" character varying(255), "cv_uploaded_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."search_profiles_role_enum" AS ENUM('frontend', 'backend', 'fullstack', 'mobile')`);
        await queryRunner.query(`CREATE TABLE "search_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "role" "public"."search_profiles_role_enum" NOT NULL, "keywords" text array NOT NULL DEFAULT '{}', "locations" text array NOT NULL DEFAULT '{}', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_79b8fdf6b0328671778f53ec84b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "job_analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "fit_score" numeric(3,1) NOT NULL, "matched_skills" text array NOT NULL DEFAULT '{}', "missing_skills" text array NOT NULL DEFAULT '{}', "summary" text NOT NULL, "salary_min" integer, "salary_max" integer, "salary_is_inferred" boolean NOT NULL DEFAULT false, "benefits" text array NOT NULL DEFAULT '{}', "benefits_is_inferred" boolean NOT NULL DEFAULT false, "analyzed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e1295eaf64b2504b09c5f6e6ebf" UNIQUE ("job_id", "profile_id"), CONSTRAINT "PK_207ba817de65f3a93a504b0d7c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."job_user_statuses_status_enum" AS ENUM('liked', 'disliked', 'applied', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "job_user_statuses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "job_id" uuid NOT NULL, "status" "public"."job_user_statuses_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5fb0a57a0c67d2f9a107a5dbe8c" UNIQUE ("user_id", "job_id"), CONSTRAINT "PK_de8758475f09b3598d87c353bc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f5a8cf8913c796be22121ed622" ON "job_user_statuses"  ("user_id", "status") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD CONSTRAINT "FK_ccf87f4bad03037832596cc4df7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_analyses" ADD CONSTRAINT "FK_e180191f159a80c4e83c32a399f" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_analyses" ADD CONSTRAINT "FK_d38d2bf654efcbf21149708159c" FOREIGN KEY ("profile_id") REFERENCES "search_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD CONSTRAINT "FK_5eca701cde34d65c520d5467a5f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" ADD CONSTRAINT "FK_cf8995ccb8de8bac3e2da36b9cc" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP CONSTRAINT "FK_cf8995ccb8de8bac3e2da36b9cc"`);
        await queryRunner.query(`ALTER TABLE "job_user_statuses" DROP CONSTRAINT "FK_5eca701cde34d65c520d5467a5f"`);
        await queryRunner.query(`ALTER TABLE "job_analyses" DROP CONSTRAINT "FK_d38d2bf654efcbf21149708159c"`);
        await queryRunner.query(`ALTER TABLE "job_analyses" DROP CONSTRAINT "FK_e180191f159a80c4e83c32a399f"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP CONSTRAINT "FK_ccf87f4bad03037832596cc4df7"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5a8cf8913c796be22121ed622"`);
        await queryRunner.query(`DROP TABLE "job_user_statuses"`);
        await queryRunner.query(`DROP TYPE "public"."job_user_statuses_status_enum"`);
        await queryRunner.query(`DROP TABLE "job_analyses"`);
        await queryRunner.query(`DROP TABLE "search_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."search_profiles_role_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_source_enum"`);
    }

}
