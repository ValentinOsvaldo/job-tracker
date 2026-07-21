import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobDescriptionSummary1784671482898 implements MigrationInterface {
    name = 'AddJobDescriptionSummary1784671482898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ADD "description_summary" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "description_summary"`);
    }

}
