import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResumeProfiles1786053343740 implements MigrationInterface {
  name = 'CreateResumeProfiles1786053343740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "resume_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "personal_info" jsonb NOT NULL, "summary" jsonb NOT NULL, "skills" jsonb NOT NULL, "experience" jsonb NOT NULL, "skill_evidence" jsonb NOT NULL, "projects" jsonb NOT NULL, "education" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_resume_profiles_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_resume_profiles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_profiles" ADD CONSTRAINT "FK_resume_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resume_profiles" DROP CONSTRAINT "FK_resume_profiles_user"`,
    );
    await queryRunner.query(`DROP TABLE "resume_profiles"`);
  }
}
