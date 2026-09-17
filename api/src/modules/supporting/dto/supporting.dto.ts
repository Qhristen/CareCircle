import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PolishWritingDto {
  @ApiProperty({ enum: ['circle-story'] })
  @IsIn(['circle-story'])
  purpose: string;
  @ApiProperty() @IsString() @Length(2, 64) occasion: string;
  @ApiProperty({ enum: ['warm', 'formal', 'joyful', 'gentle'] })
  @IsIn(['warm', 'formal', 'joyful', 'gentle'])
  tone: string;
  @ApiProperty() @IsString() @Length(5, 5000) text: string;
}

export class CatalogQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) q?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) city?: string;
  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency = 'NGN';
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
