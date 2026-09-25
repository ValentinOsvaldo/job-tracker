import { MigrationInterface, QueryRunner } from 'typeorm';

export class SingleUserMode1786200000000 implements MigrationInterface {
  name = 'SingleUserMode1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `INSERT INTO "users" ("name", "email") SELECT 'Me', 'me@localhost' WHERE NOT EXISTS (SELECT 1 FROM "users")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), PRIMARY KEY ("id"))`,
    );
  }
}
