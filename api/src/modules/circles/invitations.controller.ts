import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities/User';
import { CirclesService } from './circles.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly service: CirclesService) {}

  @Get(':code')
  @ApiContract({
    summary: 'Get invitation details',
    description:
      'Returns non-sensitive circle and invitation details for a valid invitation code.',
    responseDescription: 'The invitation preview.',
  })
  details(@Param('code') code: string) {
    return this.service.invitationDetails(code);
  }

  @Post(':code/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Accept an invitation code',
    description:
      'Accepts a valid invitation code for the authenticated user and grants private-circle access.',
    status: 201,
    responseDescription: 'The accepted invitation and circle destination.',
  })
  accept(@Param('code') code: string, @CurrentUser() user: User) {
    return this.service.acceptInvitation(code, user);
  }
}
