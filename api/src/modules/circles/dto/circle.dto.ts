import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CircleOccasion,
  CirclePrivacy,
  CircleStatus,
} from '../../../database/enums';

export class DeliveryAddressDto {
  @ApiProperty({ example: '12 Admiralty Way' })
  @IsString()
  @Length(2, 160)
  line1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;
  @ApiProperty({ example: 'Lagos' }) @IsString() @Length(2, 80) city: string;
  @ApiProperty({ example: 'Lagos' }) @IsString() @Length(2, 80) state: string;
  @ApiProperty({ example: 'Nigeria' })
  @IsString()
  @Length(2, 80)
  country: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string;
}

export class CreateGiftItemDto {
  @ApiProperty({ example: 'Baby clothes' })
  @IsString()
  @Length(2, 120)
  name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity?: number;
  @ApiProperty({ example: 30000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  targetAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() productUrl?: string;
}

export class ClientRecipientDto {
  @ApiProperty({ example: 'David Adeleke' })
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    enum: ['friend', 'family', 'partner', 'organizer', 'faith', 'other'],
  })
  @IsIn(['friend', 'family', 'partner', 'organizer', 'faith', 'other'])
  relationship: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 80) city?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class ClientFundingDto {
  @ApiProperty({ enum: ['cash', 'itemized'] })
  @IsIn(['cash', 'itemized'])
  mode: 'cash' | 'itemized';

  @ApiProperty({ example: 'NGN' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cashGoalKobo?: number | null;

  @ApiPropertyOptional({ default: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  flexBufferPercent?: number;
}

export class ClientWishlistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientReference?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  emoji?: string;
  @ApiProperty({ example: 'Smartwatch' })
  @IsString()
  @Length(2, 120)
  name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiProperty({ example: 6500000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetAmountKobo: number;
}

export class ClientDeliveryDto {
  @ApiProperty({ enum: ['provide_now', 'request_when_funded'] })
  @IsIn(['provide_now', 'request_when_funded'])
  collectionMode: 'provide_now' | 'request_when_funded';

  @ApiPropertyOptional({ type: DeliveryAddressDto, nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  address?: DeliveryAddressDto | null;
}

export class CreateCircleDto {
  @ApiProperty({ example: "Sarah's New Baby GiftCircle" })
  @IsOptional()
  @IsString()
  @Length(3, 140)
  title?: string;

  @ApiProperty({ enum: CircleOccasion })
  @IsOptional()
  @IsString()
  occasion?: CircleOccasion | string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  story?: string;
  @ApiProperty({ example: 'Sarah Okafor' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  recipientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() recipientPhone?: string;
  @ApiPropertyOptional({
    description: 'Client-uploaded cover image URL or key.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string;
  @ApiPropertyOptional({
    enum: CirclePrivacy,
    default: CirclePrivacy.LINK_ONLY,
  })
  @IsOptional()
  @IsIn([...Object.values(CirclePrivacy), 'link', 'invite', 'public'])
  privacy?: CirclePrivacy | 'link' | 'invite' | 'public';
  @ApiProperty({ example: 220000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  targetAmount?: number;
  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiProperty({ type: DeliveryAddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowGeneralContributions?: boolean;
  @ApiPropertyOptional({ type: [CreateGiftItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGiftItemDto)
  items?: CreateGiftItemDto[];

  @ApiPropertyOptional({ type: ClientRecipientDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientRecipientDto)
  recipient?: ClientRecipientDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  storyMarkdown?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverAlt?: string;

  @ApiPropertyOptional({ type: ClientFundingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientFundingDto)
  funding?: ClientFundingDto;

  @ApiPropertyOptional({ type: [ClientWishlistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientWishlistItemDto)
  wishlist?: ClientWishlistItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsDateString() closesAt?: string;

  @ApiPropertyOptional({ type: ClientDeliveryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientDeliveryDto)
  delivery?: ClientDeliveryDto;
}

export class UpdateCircleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 140)
  title?: string;
  @ApiPropertyOptional({ enum: CircleOccasion })
  @IsOptional()
  @IsString()
  occasion?: CircleOccasion | string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  story?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  recipientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() recipientPhone?: string;
  @ApiPropertyOptional({
    description: 'Client-uploaded cover image URL or key.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string;
  @ApiPropertyOptional({ enum: CirclePrivacy })
  @IsOptional()
  @IsIn([...Object.values(CirclePrivacy), 'link', 'invite', 'public'])
  privacy?: CirclePrivacy | 'link' | 'invite' | 'public';
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  targetAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional({ type: DeliveryAddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowGeneralContributions?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  storyMarkdown?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() closesAt?: string;
}

export class CircleListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
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
  @MaxLength(100)
  search?: string;
  @ApiPropertyOptional({ enum: CircleOccasion })
  @IsOptional()
  @IsEnum(CircleOccasion)
  occasion?: CircleOccasion;
  @ApiPropertyOptional({ enum: CircleStatus })
  @IsOptional()
  @IsEnum(CircleStatus)
  status?: CircleStatus;
}

export class PrivateCircleAccessDto {
  @ApiProperty() @IsString() @IsNotEmpty() invitationCode: string;
}

export class ExploreCirclesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ enum: ['active', 'ending', 'recent', 'funded'] })
  @IsOptional()
  @IsIn(['active', 'ending', 'recent', 'funded'])
  sort: 'active' | 'ending' | 'recent' | 'funded' = 'active';
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minFundedPercent?: number;
  @ApiPropertyOptional({ default: 'published' })
  @IsOptional()
  @IsIn(['published'])
  status = 'published';
  @ApiPropertyOptional({ default: 12, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 12;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}
