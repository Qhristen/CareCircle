import { MigrationInterface, QueryRunner } from 'typeorm';

export class GiftCircleInitial1800000000000 implements MigrationInterface {
  name = 'GiftCircleInitial1800000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('USER', 'ADMIN');
      CREATE TYPE "tokens_type_enum" AS ENUM ('REFRESH_TOKEN');
      CREATE TYPE "circles_occasion_enum" AS ENUM ('BIRTHDAY','WEDDING','NEW_BABY','GRADUATION','BEREAVEMENT','RECOVERY','HOUSEWARMING','COMMUNITY_SUPPORT','EMERGENCY_ASSISTANCE','OTHER');
      CREATE TYPE "circles_privacy_enum" AS ENUM ('PRIVATE','LINK_ONLY','COMMUNITY');
      CREATE TYPE "circles_status_enum" AS ENUM ('DRAFT','ACTIVE','FUNDED','FULFILLING','COMPLETED','CANCELLED','EXPIRED');
      CREATE TYPE "gift_items_status_enum" AS ENUM ('ACTIVE','FUNDED','PURCHASED','UNAVAILABLE');
      CREATE TYPE "contributions_provider_enum" AS ENUM ('PAYSTACK','MANUAL');
      CREATE TYPE "contributions_status_enum" AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');
      CREATE TYPE "invitations_status_enum" AS ENUM ('PENDING','ACCEPTED','DECLINED','EXPIRED');
      CREATE TYPE "circle_activities_type_enum" AS ENUM ('CIRCLE_CREATED','CIRCLE_PUBLISHED','GOAL_UPDATED','CONTRIBUTION_RECEIVED','ITEM_FUNDED','UPDATE_POSTED','FULFILLMENT_UPDATED','GIFT_DELIVERED','RECEIPT_CONFIRMED','CIRCLE_CANCELLED');
      CREATE TYPE "fulfillments_status_enum" AS ENUM ('PENDING','PURCHASING','PACKING','READY_FOR_DELIVERY','IN_TRANSIT','DELIVERED','CONFIRMED');
      CREATE TYPE "notifications_type_enum" AS ENUM ('INVITATION','CONTRIBUTION_RECEIVED','CIRCLE_UPDATE','GOAL_REACHED','FULFILLMENT_UPDATE','DELIVERY','SYSTEM');

      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar NULL,
        "google_id" varchar NULL UNIQUE,
        "avatar_url" varchar NULL,
        "phone" varchar(30) NULL,
        "country" varchar NOT NULL DEFAULT 'Nigeria',
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "role" users_role_enum NOT NULL DEFAULT 'USER',
        "is_suspended" boolean NOT NULL DEFAULT false,
        "deleted_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar NOT NULL UNIQUE,
        "type" tokens_type_enum NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz NULL,
        "ip_address" varchar NULL,
        "user_agent" varchar NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "circles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "slug" varchar(160) NOT NULL UNIQUE,
        "title" varchar(140) NOT NULL,
        "occasion" circles_occasion_enum NOT NULL,
        "story" text NULL,
        "recipient_name" varchar(100) NOT NULL,
        "recipient_email" varchar NULL,
        "recipient_phone" varchar(30) NULL,
        "cover_image_url" varchar NULL,
        "privacy" circles_privacy_enum NOT NULL DEFAULT 'LINK_ONLY',
        "status" circles_status_enum NOT NULL DEFAULT 'DRAFT',
        "target_amount" numeric(14,2) NOT NULL CHECK ("target_amount" > 0),
        "amount_raised" numeric(14,2) NOT NULL DEFAULT 0 CHECK ("amount_raised" >= 0),
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "deadline" timestamptz NOT NULL,
        "delivery_address" jsonb NOT NULL,
        "allow_general_contributions" boolean NOT NULL DEFAULT true,
        "published_at" timestamptz NULL,
        "completed_at" timestamptz NULL,
        "recipient_token_hash" varchar NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "gift_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "description" text NULL,
        "quantity" integer NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
        "target_amount" numeric(14,2) NOT NULL CHECK ("target_amount" > 0),
        "funded_amount" numeric(14,2) NOT NULL DEFAULT 0 CHECK ("funded_amount" >= 0),
        "product_url" varchar NULL,
        "image_url" varchar NULL,
        "status" gift_items_status_enum NOT NULL DEFAULT 'ACTIVE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "contributions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE RESTRICT,
        "contributor_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "gift_item_id" uuid NULL REFERENCES "gift_items"("id") ON DELETE SET NULL,
        "guest_name" varchar(100) NULL,
        "guest_email" varchar NULL,
        "amount" numeric(14,2) NOT NULL CHECK ("amount" > 0),
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "provider" contributions_provider_enum NOT NULL DEFAULT 'PAYSTACK',
        "payment_reference" varchar NOT NULL UNIQUE,
        "status" contributions_status_enum NOT NULL DEFAULT 'PENDING',
        "message" text NULL,
        "show_name" boolean NOT NULL DEFAULT true,
        "show_amount" boolean NOT NULL DEFAULT true,
        "show_message" boolean NOT NULL DEFAULT true,
        "provider_payload" jsonb NULL,
        "paid_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "email" varchar NULL,
        "phone" varchar(30) NULL,
        "code" varchar(64) NOT NULL UNIQUE,
        "status" invitations_status_enum NOT NULL DEFAULT 'PENDING',
        "accepted_by_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_invitation_contact" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL)
      );

      CREATE TABLE "circle_updates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "title" varchar(140) NOT NULL,
        "message" text NOT NULL,
        "image_url" varchar NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "circle_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL REFERENCES "circles"("id") ON DELETE CASCADE,
        "type" circle_activities_type_enum NOT NULL,
        "description" varchar(255) NOT NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "fulfillments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "circle_id" uuid NOT NULL UNIQUE REFERENCES "circles"("id") ON DELETE CASCADE,
        "status" fulfillments_status_enum NOT NULL DEFAULT 'PENDING',
        "delivery_address" jsonb NOT NULL,
        "courier_name" varchar NULL,
        "tracking_number" varchar NULL,
        "tracking_url" varchar NULL,
        "proof_url" varchar NULL,
        "note" text NULL,
        "dispatched_at" timestamptz NULL,
        "delivered_at" timestamptz NULL,
        "confirmed_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" notifications_type_enum NOT NULL,
        "title" varchar(140) NOT NULL,
        "message" text NOT NULL,
        "data" jsonb NULL,
        "read_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX "IDX_tokens_user_type" ON "tokens" ("user_id", "type");
      CREATE INDEX "IDX_circles_organizer_status" ON "circles" ("organizer_id", "status");
      CREATE INDEX "IDX_circles_discovery" ON "circles" ("privacy", "status", "deadline");
      CREATE INDEX "IDX_gift_items_circle_status" ON "gift_items" ("circle_id", "status");
      CREATE INDEX "IDX_contributions_circle_status" ON "contributions" ("circle_id", "status");
      CREATE INDEX "IDX_contributions_user_status" ON "contributions" ("contributor_id", "status");
      CREATE INDEX "IDX_invitations_circle_status" ON "invitations" ("circle_id", "status");
      CREATE INDEX "IDX_activities_circle_created" ON "circle_activities" ("circle_id", "created_at");
      CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "read_at");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "notifications" CASCADE;
      DROP TABLE IF EXISTS "fulfillments" CASCADE;
      DROP TABLE IF EXISTS "circle_activities" CASCADE;
      DROP TABLE IF EXISTS "circle_updates" CASCADE;
      DROP TABLE IF EXISTS "invitations" CASCADE;
      DROP TABLE IF EXISTS "contributions" CASCADE;
      DROP TABLE IF EXISTS "gift_items" CASCADE;
      DROP TABLE IF EXISTS "circles" CASCADE;
      DROP TABLE IF EXISTS "tokens" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TYPE IF EXISTS "notifications_type_enum";
      DROP TYPE IF EXISTS "fulfillments_status_enum";
      DROP TYPE IF EXISTS "circle_activities_type_enum";
      DROP TYPE IF EXISTS "invitations_status_enum";
      DROP TYPE IF EXISTS "contributions_status_enum";
      DROP TYPE IF EXISTS "contributions_provider_enum";
      DROP TYPE IF EXISTS "gift_items_status_enum";
      DROP TYPE IF EXISTS "circles_status_enum";
      DROP TYPE IF EXISTS "circles_privacy_enum";
      DROP TYPE IF EXISTS "circles_occasion_enum";
      DROP TYPE IF EXISTS "tokens_type_enum";
      DROP TYPE IF EXISTS "users_role_enum";
    `);
  }
}
