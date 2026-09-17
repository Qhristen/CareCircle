import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvitationRecipientDto {
  @ApiPropertyOptional()
  @ValidateIf((o: InvitationRecipientDto) => !o.phone)
  @IsEmail()
  email?: string;
  @ApiPropertyOptional()
  @ValidateIf((o: InvitationRecipientDto) => !o.email)
  @IsPhoneNumber()
  phone?: string;
}

export class CreateInvitationsDto {
  @ApiProperty({ type: [InvitationRecipientDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InvitationRecipientDto)
  recipients: InvitationRecipientDto[];
}

export class ClientInvitationRecipientDto {
  @ApiPropertyOptional({ enum: ['email', 'sms'] })
  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  value: string;
}

export class ClientCreateInvitationsDto {
  @ApiPropertyOptional({ type: [ClientInvitationRecipientDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ClientInvitationRecipientDto)
  recipients: ClientInvitationRecipientDto[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}

export class AcceptCircleInvitationDto {
  @ApiPropertyOptional() @IsString() @MaxLength(500) token: string;
}
