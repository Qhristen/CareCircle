import {
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  @ApiContract({
    summary: 'Get my profile',
    description:
      'Returns the authenticated user profile and account preferences.',
    response: {
      status: 200,
      type: UserProfileResponseDto,
      description: 'The current user profile.',
    },
  })
  profile(@CurrentUser('id') id: string) {
    return this.service.profile(id);
  }
  @Patch('me')
  @ApiContract({
    summary: 'Update my profile',
    description:
      'Updates supplied profile fields; avatarUrl is a client-uploaded string reference.',
    response: {
      status: 200,
      type: UserProfileResponseDto,
      description: 'The updated user profile.',
    },
  })
  update(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(id, dto);
  }
  @Delete('me')
  @ApiContract({
    summary: 'Delete my account',
    description:
      'Anonymizes the authenticated user account while retaining transaction records required for integrity.',
    responseDescription: 'An account deletion confirmation.',
  })
  remove(@CurrentUser('id') id: string) {
    return this.service.delete(id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiContract({
    summary: 'List users',
    description:
      'Returns a searchable, page-based user directory for administrators.',
    responseDescription: 'Users and pagination metadata.',
  })
  adminList(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('search') search?: string,
  ) {
    return this.service.adminList(page, limit, search);
  }
}
