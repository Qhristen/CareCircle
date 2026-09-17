import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class ContributionPrivacyDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hideAmount?: boolean;
}

export class ContributionPayerDto {
  @ApiProperty({ example: 'Ada Okafor' })
  @IsString()
  @Length(2, 100)
  displayName: string;
  @ApiProperty({ example: 'ada@example.com' }) @IsEmail() email: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateContributionDto {
  @ApiProperty({ example: 5000 })
  @ValidateIf((o: CreateContributionDto) => o.amountKobo === undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID() giftItemId?: string;
  @ApiPropertyOptional()
  @ValidateIf((o: CreateContributionDto) => !!o.guestEmail)
  @IsString()
  @Length(2, 100)
  guestName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() guestEmail?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showName?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showAmount?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showMessage?: boolean;
  @ApiPropertyOptional({
    description: 'Invitation code required for private circles',
  })
  @IsOptional()
  @IsString()
  invitationCode?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountKobo?: number;
  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() wishlistItemId?: string;
  @ApiPropertyOptional({ type: () => ContributionPrivacyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContributionPrivacyDto)
  privacy?: ContributionPrivacyDto;
  @ApiPropertyOptional({ type: () => ContributionPayerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContributionPayerDto)
  payer?: ContributionPayerDto;
  @ApiPropertyOptional({ enum: ['card', 'bank_transfer'] })
  @IsOptional()
  @IsIn(['card', 'bank_transfer'])
  paymentMethod?: 'card' | 'bank_transfer';
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  returnUrl?: string;
}

export class CreateContributionIntentDto extends OmitType(
  CreateContributionDto,
  ['guestName', 'guestEmail', 'payer', 'paymentMethod'] as const,
) {}

export class ContributionListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit = 20;
}

export class PublicContributionsQueryDto {
  @ApiPropertyOptional({ enum: ['public'], default: 'public' })
  @IsOptional()
  @IsIn(['public'])
  view = 'public';
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasMessage?: boolean;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  invitationCode?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  invitationToken?: string;
}
