import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) phone: string | null;
  @ApiProperty() country: string;
  @ApiProperty() currency: string;
  @ApiProperty() createdAt: Date;
}
