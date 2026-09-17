import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCircleUpdateDto {
  @ApiProperty() @IsString() @Length(2, 140) title: string;
  @ApiProperty() @IsString() @Length(2, 5000) message: string;
  @ApiPropertyOptional({ description: 'Client-uploaded image URL or key.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;
}

export class UpdateCircleUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 140)
  title?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
  @ApiPropertyOptional({ description: 'Client-uploaded image URL or key.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;
}
