import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/enums';
import {
  CreateModerationReportDto,
  ModerationActionDto,
  ModerationListQueryDto,
  ReviewModerationReportDto,
} from './dto/moderation.dto';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Post('reports')
  @ApiContract({
    summary: 'Report content',
    description:
      'Creates a moderation report from the authenticated user for a circle, contribution, update, or user.',
    status: 201,
    responseDescription: 'The newly created moderation report.',
  })
  report(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateModerationReportDto,
  ) {
    return this.service.report(userId, dto);
  }

  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'List moderation reports',
    description:
      'Returns a filtered, paginated moderation queue for administrators.',
    responseDescription: 'Moderation reports and pagination metadata.',
  })
  reports(@Query() query: ModerationListQueryDto) {
    return this.service.list(query);
  }

  @Patch('reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'Review a moderation report',
    description:
      'Records an administrator decision, review note, and report status.',
    responseDescription: 'The reviewed moderation report.',
  })
  review(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: ReviewModerationReportDto,
  ) {
    return this.service.review(id, reviewerId, dto);
  }

  @Post('users/:id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'Suspend a user',
    description:
      'Suspends a non-administrator account and records the acting administrator.',
    status: 201,
    responseDescription: 'The suspended user state.',
  })
  suspend(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.service.suspendUser(id, adminId);
  }

  @Post('users/:id/unsuspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'Unsuspend a user',
    description: 'Restores access for a suspended user account.',
    status: 201,
    responseDescription: 'The restored user state.',
  })
  unsuspend(@Param('id') id: string) {
    return this.service.unsuspendUser(id);
  }

  @Post('circles/:id/hide')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'Hide a circle',
    description:
      'Removes a circle from public visibility and records an optional moderation note.',
    status: 201,
    responseDescription: 'The hidden circle state.',
  })
  hide(@Param('id') id: string, @Body() dto: ModerationActionDto) {
    return this.service.setCircleVisibility(id, true, dto.note);
  }

  @Post('circles/:id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'Restore a circle',
    description:
      'Restores a previously hidden circle to its privacy-controlled visibility.',
    status: 201,
    responseDescription: 'The restored circle state.',
  })
  restore(@Param('id') id: string, @Body() dto: ModerationActionDto) {
    return this.service.setCircleVisibility(id, false, dto.note);
  }
}
