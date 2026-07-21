import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitProfileSalaryByCurrency1784674969135 implements MigrationInterface {
    name = 'SplitProfileSalaryByCurrency1784674969135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_min_mxn" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_max_mxn" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_min_usd" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_max_usd" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_currency"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_max"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_min"`);
        await queryRunner.query(`DROP TYPE "public"."search_profiles_salary_currency_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."search_profiles_salary_currency_enum" AS ENUM('USD', 'MXN')`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_min" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_max" integer`);
        await queryRunner.query(`ALTER TABLE "search_profiles" ADD "salary_currency" "public"."search_profiles_salary_currency_enum"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_max_usd"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_min_usd"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_max_mxn"`);
        await queryRunner.query(`ALTER TABLE "search_profiles" DROP COLUMN "salary_min_mxn"`);
    }

}
