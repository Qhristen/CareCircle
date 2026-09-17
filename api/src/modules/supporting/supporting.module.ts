import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogItem } from '../../database/entities/ClientOperations';
import { CatalogController, WritingController } from './supporting.controller';
import { SupportingService } from './supporting.service';

@Module({
  imports: [TypeOrmModule.forFeature([CatalogItem])],
  controllers: [WritingController, CatalogController],
  providers: [SupportingService],
})
export class SupportingModule {}
