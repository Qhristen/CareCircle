import { MigrationInterface, QueryRunner } from 'typeorm';

export class GiftCircleRestoredModules1800000001000 implements MigrationInterface {
  name = 'GiftCircleRestoredModules1800000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "moderation_reports_target_type_enum" AS ENUM ('USER','CIRCLE','CIRCLE_UPDATE','CONTRIBUTION');
      CREATE TYPE "moderation_reports_reason_enum" AS ENUM ('FRAUD','MISLEADING','HARASSMENT','PRIVACY','PROHIBITED_CONTENT','OTHER');
      CREATE TYPE "moderation_reports_status_enum" AS ENUM ('OPEN','REVIEWING','RESOLVED','DISMISSED');

      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL UNIQUE,
        "slug" varchar(120) NOT NULL UNIQUE,
        "description" text NULL,
        "icon_url" varchar NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE "circles" ADD COLUMN "is_hidden" boolean NOT NULL DEFAULT false;
      ALTER TABLE "gift_items" ADD COLUMN "category_id" uuid NULL;
      ALTER TABLE "gift_items" ADD CONSTRAINT "FK_gift_items_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;

      CREATE TABLE "moderation_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "target_type" moderation_reports_target_type_enum NOT NULL,
        "target_id" uuid NOT NULL,
        "reason" moderation_reports_reason_enum NOT NULL,
        "details" text NULL,
        "status" moderation_reports_status_enum NOT NULL DEFAULT 'OPEN',
        "reviewed_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "resolution_note" text NULL,
        "resolved_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX "IDX_moderation_status_created" ON "moderation_reports" ("status", "created_at");
      CREATE INDEX "IDX_moderation_target" ON "moderation_reports" ("target_type", "target_id");

      INSERT INTO "categories" ("name", "slug", "description", "sort_order") VALUES
        ('Essentials', 'essentials', 'Everyday practical needs', 10),
        ('Food & Groceries', 'food-groceries', 'Groceries, meals, and food support', 20),
        ('Baby Care', 'baby-care', 'Clothing, feeding, and baby essentials', 30),
        ('Health & Recovery', 'health-recovery', 'Recovery and wellbeing support', 40),
        ('Clothing', 'clothing', 'Clothing and personal items', 50),
        ('Home', 'home', 'Household and housewarming items', 60),
        ('Education', 'education', 'Books, fees, devices, and student support', 70),
        ('Celebration', 'celebration', 'Cakes, decorations, and celebration gifts', 80),
        ('Transportation', 'transportation', 'Transport and mobility support', 90),
        ('Other', 'other', 'Other requested support', 100);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "moderation_reports" CASCADE;
      ALTER TABLE "gift_items" DROP CONSTRAINT IF EXISTS "FK_gift_items_category";
      ALTER TABLE "gift_items" DROP COLUMN IF EXISTS "category_id";
      ALTER TABLE "circles" DROP COLUMN IF EXISTS "is_hidden";
      DROP TABLE IF EXISTS "categories" CASCADE;
      DROP TYPE IF EXISTS "moderation_reports_status_enum";
      DROP TYPE IF EXISTS "moderation_reports_reason_enum";
      DROP TYPE IF EXISTS "moderation_reports_target_type_enum";
    `);
  }
}
