import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobWorkModeAndUserLocation1784920956051 implements MigrationInterface {
    name = 'AddJobWorkModeAndUserLocation1784920956051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_work_mode_enum" AS ENUM('remote', 'hybrid', 'onsite', 'unknown')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "work_mode" "public"."jobs_work_mode_enum" NOT NULL DEFAULT 'unknown'`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_work_mode_source_enum" AS ENUM('heuristic', 'ai')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "work_mode_source" "public"."jobs_work_mode_source_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "location_city" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "location_region" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "location_country" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "home_city" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "home_country" character varying(150)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "home_country"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "home_city"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "location_country"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "location_region"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "location_city"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "work_mode_source"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_work_mode_source_enum"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "work_mode"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_work_mode_enum"`);
    }

}
