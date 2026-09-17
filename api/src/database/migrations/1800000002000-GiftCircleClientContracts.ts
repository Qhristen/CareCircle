import { MigrationInterface, QueryRunner } from 'typeorm';

export class GiftCircleClientContracts1800000002000 implements MigrationInterface {
  name = 'GiftCircleClientContracts1800000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "contributions_status_enum" ADD VALUE IF NOT EXISTS 'PROCESSING';
      ALTER TYPE "contributions_status_enum" ADD VALUE IF NOT EXISTS 'EXPIRED';

      ALTER TABLE "circles"
        ADD COLUMN IF NOT EXISTS "recipient_relationship" varchar(24) NULL,
        ADD COLUMN IF NOT EXISTS "recipient_city" varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS "recipient_country_code" varchar(2) NULL,
        ADD COLUMN IF NOT EXISTS "cover_asset_id" varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS "cover_alt" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "funding_mode" varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS "flex_buffer_percent" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "delivery_collection_mode" varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS "supporter_count" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "publish_idempotency_key" varchar(160) NULL,
        ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
      ALTER TABLE "circles" ALTER COLUMN "delivery_address" DROP NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_circles_publish_idempotency_key"
        ON "circles" ("publish_idempotency_key")
        WHERE "publish_idempotency_key" IS NOT NULL;

      ALTER TABLE "gift_items"
        ADD COLUMN IF NOT EXISTS "emoji" varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS "category_label" varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS "client_reference" varchar(120) NULL;

      ALTER TABLE "contributions"
        ADD COLUMN IF NOT EXISTS "guest_phone" varchar(30) NULL,
        ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(160) NULL,
        ADD COLUMN IF NOT EXISTS "payment_method" varchar(32) NOT NULL DEFAULT 'card';
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_contributions_idempotency_key"
        ON "contributions" ("idempotency_key")
        WHERE "idempotency_key" IS NOT NULL;

      ALTER TABLE "invitations"
        ADD COLUMN IF NOT EXISTS "token_hash" text NULL,
        ADD COLUMN IF NOT EXISTS "batch_id" uuid NULL,
        ADD COLUMN IF NOT EXISTS "channel" varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS "message" text NULL;
      CREATE INDEX IF NOT EXISTS "IDX_invitations_token_hash" ON "invitations" ("token_hash");

      ALTER TABLE "fulfillments"
        ADD COLUMN IF NOT EXISTS "address_status" varchar(24) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "purchase_order_status" varchar(32) NOT NULL DEFAULT 'not_requested';
      ALTER TABLE "fulfillments" ALTER COLUMN "delivery_address" DROP NOT NULL;

      UPDATE "circles" AS c SET "supporter_count" = stats.total
      FROM (
        SELECT "circle_id", COUNT(DISTINCT COALESCE("contributor_id"::text, "guest_email", "id"::text))::integer AS total
        FROM "contributions" WHERE "status" = 'SUCCESS' GROUP BY "circle_id"
      ) AS stats WHERE c."id" = stats."circle_id";

      CREATE TABLE IF NOT EXISTS "contribution_ledger_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "contribution_id" uuid NOT NULL UNIQUE REFERENCES "contributions"("id") ON DELETE RESTRICT,
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE RESTRICT,
        "amount" numeric(14,2) NOT NULL CHECK ("amount" > 0),
        "currency" varchar(3) NOT NULL,
        "direction" varchar(16) NOT NULL DEFAULT 'credit',
        "status" varchar(24) NOT NULL DEFAULT 'posted',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "circle_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "contribution_id" uuid NULL REFERENCES "contributions"("id") ON DELETE SET NULL,
        "kind" varchar(24) NOT NULL DEFAULT 'organizer_message',
        "message" text NOT NULL,
        "reply_email" varchar(255) NULL,
        "status" varchar(24) NOT NULL DEFAULT 'queued',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_circle_messages_circle_created" ON "circle_messages" ("circle_id", "created_at");

      CREATE TABLE IF NOT EXISTS "circle_broadcasts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "message" text NOT NULL,
        "channels" jsonb NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'queued',
        "recipient_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "type" varchar(24) NOT NULL,
        "wishlist_item_ids" uuid[] NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'under_review',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "circle_memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "invitation_id" uuid NULL UNIQUE REFERENCES "invitations"("id") ON DELETE SET NULL,
        "role" varchar(24) NOT NULL DEFAULT 'contributor',
        "status" varchar(24) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_circle_membership_user" UNIQUE ("circle_id", "user_id")
      );

      CREATE TABLE IF NOT EXISTS "delivery_address_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL UNIQUE REFERENCES "circles"("id") ON DELETE CASCADE,
        "encrypted_payload" text NOT NULL,
        "status" varchar(24) NOT NULL DEFAULT 'saved',
        "confirmed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "catalog_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "description" text NULL,
        "merchant_name" varchar(160) NOT NULL,
        "merchant_verified" boolean NOT NULL DEFAULT true,
        "price_amount" numeric(14,2) NOT NULL CHECK ("price_amount" > 0),
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "city" varchar(80) NULL,
        "available" boolean NOT NULL DEFAULT true,
        "delivery_estimate" varchar(120) NULL,
        "image_url" text NULL,
        "product_url" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_catalog_items_search" ON "catalog_items" ("name", "city", "currency");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "catalog_items" CASCADE;
      DROP TABLE IF EXISTS "delivery_address_records" CASCADE;
      DROP TABLE IF EXISTS "circle_memberships" CASCADE;
      DROP TABLE IF EXISTS "purchase_orders" CASCADE;
      DROP TABLE IF EXISTS "circle_broadcasts" CASCADE;
      DROP TABLE IF EXISTS "circle_messages" CASCADE;
      DROP TABLE IF EXISTS "contribution_ledger_entries" CASCADE;

      ALTER TABLE "fulfillments" DROP COLUMN IF EXISTS "purchase_order_status", DROP COLUMN IF EXISTS "address_status";
      ALTER TABLE "invitations" DROP COLUMN IF EXISTS "message", DROP COLUMN IF EXISTS "channel", DROP COLUMN IF EXISTS "batch_id", DROP COLUMN IF EXISTS "token_hash";
      ALTER TABLE "contributions" DROP COLUMN IF EXISTS "payment_method", DROP COLUMN IF EXISTS "idempotency_key", DROP COLUMN IF EXISTS "guest_phone";
      ALTER TABLE "gift_items" DROP COLUMN IF EXISTS "client_reference", DROP COLUMN IF EXISTS "category_label", DROP COLUMN IF EXISTS "emoji";
      ALTER TABLE "circles"
        DROP COLUMN IF EXISTS "version",
        DROP COLUMN IF EXISTS "publish_idempotency_key",
        DROP COLUMN IF EXISTS "supporter_count",
        DROP COLUMN IF EXISTS "delivery_collection_mode",
        DROP COLUMN IF EXISTS "flex_buffer_percent",
        DROP COLUMN IF EXISTS "funding_mode",
        DROP COLUMN IF EXISTS "cover_alt",
        DROP COLUMN IF EXISTS "cover_asset_id",
        DROP COLUMN IF EXISTS "recipient_country_code",
        DROP COLUMN IF EXISTS "recipient_city",
        DROP COLUMN IF EXISTS "recipient_relationship";
    `);
  }
}
