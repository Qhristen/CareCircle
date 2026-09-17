import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryAddressDto } from './circle.dto';

export class CircleMessageDto {
  @ApiProperty() @IsString() @Length(2, 2000) message: string;
  @ApiProperty() @IsEmail() replyEmail: string;
}

export class OrganizerContributionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ enum: ['card', 'bank_transfer'] })
  @IsOptional()
  @IsIn(['card', 'bank_transfer'])
  method?: string;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}

export class ClientWishlistCreateDto {
  @ApiProperty() @IsString() @Length(2, 120) name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  emoji?: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) targetAmountKobo: number;
}

export class ClientWishlistUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  emoji?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetAmountKobo?: number;
}

export class CircleSettingsDto {
  @ApiProperty({ enum: ['link', 'invite', 'public'] })
  @IsIn(['link', 'invite', 'public'])
  privacy: 'link' | 'invite' | 'public';
}

export class ThankContributorDto {
  @ApiProperty() @IsString() @Length(2, 1000) message: string;
}

export class BroadcastDto {
  @ApiProperty() @IsString() @Length(2, 3000) message: string;
  @ApiProperty({ isArray: true, enum: ['whatsapp', 'in_app', 'email'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(['whatsapp', 'in_app', 'email'], { each: true })
  channels: string[];
}

export class PurchaseOrderDto {
  @ApiProperty({ enum: ['early'] }) @IsIn(['early']) type: 'early';
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  wishlistItemIds: string[];
}

export class SaveDeliveryAddressDto extends DeliveryAddressDto {}
