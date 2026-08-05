import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockedCompanies1784930000000 implements MigrationInterface {
  name = 'AddBlockedCompanies1784930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blocked_companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company" character varying(255) NOT NULL, "company_normalized" character varying(255) NOT NULL, "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_blocked_companies_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_blocked_companies_normalized" ON "blocked_companies" ("company_normalized")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_blocked_companies_normalized"`,
    );
    await queryRunner.query(`DROP TABLE "blocked_companies"`);
  }
}
