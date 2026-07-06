import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePasswordHashToPassword1740000000001
  implements MigrationInterface
{
  name = 'RenamePasswordHashToPassword1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "password_hash" TO "password"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "password" TO "password_hash"
    `);
  }
}
