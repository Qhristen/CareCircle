import { IsOptional, IsString, IsUUID } from 'class-validator';

export class JoinCircleRoomDto {
  @IsUUID() circleId: string;
  @IsOptional() @IsString() invitationCode?: string;
}

export class LeaveCircleRoomDto {
  @IsUUID() circleId: string;
}
