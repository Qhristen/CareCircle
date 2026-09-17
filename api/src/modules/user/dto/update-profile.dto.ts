import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
  @ApiPropertyOptional({
    description: 'Client-uploaded avatar image URL or key.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 2048)
  avatarUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 80)
  country?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
