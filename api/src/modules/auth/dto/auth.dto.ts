import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ada Okafor' })
  @IsString()
  @Length(2, 100)
  name: string;
  @ApiProperty({ example: 'ada@example.com' }) @IsEmail() email: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) password: string;
  @ApiPropertyOptional({ enum: ['mobile', 'web'] })
  @IsOptional()
  @IsIn(['mobile', 'web'])
  platform?: 'mobile' | 'web';
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() password: string;
  @ApiPropertyOptional({ enum: ['mobile', 'web'] })
  @IsOptional()
  @IsIn(['mobile', 'web'])
  platform?: 'mobile' | 'web';
}

export class GoogleLoginDto {
  @ApiProperty() @IsString() idToken: string;
  @ApiPropertyOptional({ enum: ['mobile', 'web'] })
  @IsOptional()
  @IsIn(['mobile', 'web'])
  platform?: 'mobile' | 'web';
}

export class RefreshTokenDto {
  @ApiPropertyOptional() @IsOptional() @IsString() refreshToken?: string;
}
