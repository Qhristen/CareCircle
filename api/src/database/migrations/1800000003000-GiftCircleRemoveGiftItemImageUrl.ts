import { MigrationInterface, QueryRunner } from 'typeorm';

export class GiftCircleRemoveGiftItemImageUrl1800000003000 implements MigrationInterface {
  name = 'GiftCircleRemoveGiftItemImageUrl1800000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "gift_items" DROP COLUMN IF EXISTS "image_url"',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "gift_items" ADD COLUMN IF NOT EXISTS "image_url" text NULL',
    );
  }
}
