import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentStatus } from '../../../database/enums';

export class UpdateFulfillmentDto {
  @ApiProperty({ enum: FulfillmentStatus })
  @IsEnum(FulfillmentStatus)
  status: FulfillmentStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courierName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() trackingUrl?: string;
  @ApiPropertyOptional({
    description: 'Client-uploaded proof image URL or key.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  proofUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ConfirmReceiptDto {
  @ApiProperty() @IsString() token: string;
}
