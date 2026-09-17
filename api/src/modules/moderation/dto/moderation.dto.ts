import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ModerationReason,
  ModerationStatus,
  ModerationTargetType,
} from '../../../database/enums';

export class CreateModerationReportDto {
  @ApiProperty({ enum: ModerationTargetType })
  @IsEnum(ModerationTargetType)
  targetType: ModerationTargetType;
  @ApiProperty() @IsUUID() targetId: string;
  @ApiProperty({ enum: ModerationReason })
  @IsEnum(ModerationReason)
  reason: ModerationReason;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 3000)
  details?: string;
}

export class ReviewModerationReportDto {
  @ApiProperty({
    enum: [
      ModerationStatus.REVIEWING,
      ModerationStatus.RESOLVED,
      ModerationStatus.DISMISSED,
    ],
  })
  @IsEnum(ModerationStatus)
  status: ModerationStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 3000)
  resolutionNote?: string;
}

export class ModerationListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @ApiPropertyOptional({ enum: ModerationStatus })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;
  @ApiPropertyOptional({ enum: ModerationTargetType })
  @IsOptional()
  @IsEnum(ModerationTargetType)
  targetType?: ModerationTargetType;
}

export class ModerationActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 1000)
  note?: string;
}
