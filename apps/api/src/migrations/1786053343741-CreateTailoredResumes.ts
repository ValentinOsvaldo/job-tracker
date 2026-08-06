import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTailoredResumes1786053343741 implements MigrationInterface {
  name = 'CreateTailoredResumes1786053343741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tailored_resumes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "user_id" uuid NOT NULL, "generated_content" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_tailored_resumes_user_job" UNIQUE ("user_id", "job_id"), CONSTRAINT "PK_tailored_resumes_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" ADD CONSTRAINT "FK_tailored_resumes_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" ADD CONSTRAINT "FK_tailored_resumes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" DROP CONSTRAINT "FK_tailored_resumes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" DROP CONSTRAINT "FK_tailored_resumes_job"`,
    );
    await queryRunner.query(`DROP TABLE "tailored_resumes"`);
  }
}
