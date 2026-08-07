import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTailoredResumeLanguage1786066690769
  implements MigrationInterface
{
  name = 'AddTailoredResumeLanguage1786066690769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" ADD "language" character varying NOT NULL DEFAULT 'en'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tailored_resumes" DROP COLUMN "language"`,
    );
  }
}
