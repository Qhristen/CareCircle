import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiContract({
    summary: 'List notifications',
    description:
      'Returns page-based notifications and unread totals for the authenticated user.',
    responseDescription: 'Notifications and pagination metadata.',
  })
  list(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.service.list(userId, page, limit);
  }

  @Patch('read-all')
  @ApiContract({
    summary: 'Mark all notifications read',
    description:
      'Marks every unread notification for the current user as read.',
    responseDescription: 'The number of notifications marked read.',
  })
  readAll(@CurrentUser('id') userId: string) {
    return this.service.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiContract({
    summary: 'Mark a notification read',
    description: 'Marks one notification owned by the current user as read.',
    responseDescription: 'The updated notification.',
  })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.markRead(userId, id);
  }

  @Delete(':id')
  @ApiContract({
    summary: 'Delete a notification',
    description: 'Deletes one notification owned by the current user.',
    responseDescription: 'A notification deletion confirmation.',
  })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
