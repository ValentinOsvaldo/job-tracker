import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobRelevance1784928587501 implements MigrationInterface {
    name = 'AddJobRelevance1784928587501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."jobs_relevance_enum" AS ENUM('unknown', 'relevant', 'irrelevant')`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "relevance" "public"."jobs_relevance_enum" NOT NULL DEFAULT 'unknown'`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "relevance_reason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "relevance_reason"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "relevance"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_relevance_enum"`);
    }

}
