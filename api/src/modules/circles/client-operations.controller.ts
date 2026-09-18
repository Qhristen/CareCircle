import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities/User';
import { ClientOperationsService } from './client-operations.service';
import {
  BroadcastDto,
  CircleMessageDto,
  CircleSettingsDto,
  ClientWishlistCreateDto,
  ClientWishlistUpdateDto,
  OrganizerContributionQueryDto,
  PurchaseOrderDto,
  SaveDeliveryAddressDto,
  ThankContributorDto,
} from './dto/client-operations.dto';
import {
  AcceptCircleInvitationDto,
  ClientCreateInvitationsDto,
} from './dto/invitation.dto';

@ApiTags('circle messages')
@Controller('circles')
export class CircleMessagesController {
  constructor(private readonly service: ClientOperationsService) {}

  @Post(':id/messages')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiContract({
    summary: 'Message a circle organizer',
    description:
      'Queues a public visitor message and reply email for the organizer of a visible circle.',
    status: 201,
    responseDescription: 'The queued message acknowledgement.',
  })
  message(@Param('id') id: string, @Body() dto: CircleMessageDto) {
    return this.service.messageOrganizer(id, dto);
  }
}

@ApiTags('organizer')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('organizer/circles')
export class OrganizerController {
  constructor(private readonly service: ClientOperationsService) {}

  @Get(':id/dashboard')
  @ApiContract({
    summary: 'Get organizer dashboard',
    description:
      'Returns the client organizer summary, funding progress, wishlist, contribution activity, and fulfillment stage.',
    responseDescription: 'The organizer dashboard.',
  })
  dashboard(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.dashboard(id, user);
  }

  @Get(':id/contributions')
  @ApiContract({
    summary: 'List contribution roster',
    description:
      'Returns a cursor-paginated and searchable roster of successful contributions for a managed circle.',
    responseDescription: 'Contribution records and cursor metadata.',
  })
  roster(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() query: OrganizerContributionQueryDto,
  ) {
    return this.service.contributionRoster(id, user, query);
  }

  @Get(':id/contributions/export')
  @ApiProduces('text/csv')
  @ApiContract({
    summary: 'Export contributions',
    description:
      'Downloads all successful contributions for a managed circle as CSV. The only supported format is csv.',
    response: {
      status: 200,
      description: 'A UTF-8 CSV contribution export.',
      schema: { type: 'string' },
    },
  })
  async export(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (format && format !== 'csv') {
      throw new BadRequestException('Only CSV export is supported');
    }
    const csv = await this.service.exportContributions(id, user);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="CareCircle-contributors-${id}.csv"`,
    );
    return csv;
  }

  @Post(':id/wishlist-items')
  @ApiContract({
    summary: 'Add organizer wishlist item',
    description:
      'Adds an uncategorized wishlist item and recalculates an itemized goal.',
    status: 201,
    responseDescription: 'The new item and recalculated goal.',
  })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ClientWishlistCreateDto,
  ) {
    return this.service.addWishlistItem(id, user, dto);
  }

  @Patch(':id/wishlist-items/:itemId')
  @ApiContract({
    summary: 'Update organizer wishlist item',
    description:
      'Updates a wishlist item and recalculates the itemized goal without reducing it below raised funds.',
    responseDescription: 'The updated item and recalculated goal.',
  })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body() dto: ClientWishlistUpdateDto,
  ) {
    return this.service.updateWishlistItem(id, itemId, user, dto);
  }

  @Delete(':id/wishlist-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiContract({
    summary: 'Delete organizer wishlist item',
    description:
      'Deletes an unfunded wishlist item and recalculates the itemized goal.',
    status: HttpStatus.NO_CONTENT,
  })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeWishlistItem(id, itemId, user);
  }

  @Patch(':id/settings')
  @ApiContract({
    summary: 'Update circle settings',
    description: 'Updates organizer-controlled privacy settings for a circle.',
    responseDescription: 'The updated client-facing settings.',
  })
  settings(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CircleSettingsDto,
  ) {
    return this.service.settings(id, user, dto);
  }

  @Post(':id/contributions/:contributionId/thank')
  @ApiContract({
    summary: 'Thank a contributor',
    description:
      'Queues a thank-you message from the organizer to a successful contributor.',
    status: 201,
    responseDescription: 'The queued thank-you acknowledgement.',
  })
  thank(
    @Param('id') id: string,
    @Param('contributionId') contributionId: string,
    @CurrentUser() user: User,
    @Body() dto: ThankContributorDto,
  ) {
    return this.service.thank(id, contributionId, user, dto);
  }

  @Post(':id/broadcasts')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiContract({
    summary: 'Queue a circle broadcast',
    description:
      'Queues an organizer announcement for the selected WhatsApp, in-app, or email channels.',
    status: HttpStatus.ACCEPTED,
    responseDescription: 'The queued broadcast and delivery counts.',
  })
  broadcast(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: BroadcastDto,
  ) {
    return this.service.broadcast(id, user, dto);
  }

  @Post(':id/purchase-orders')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiContract({
    summary: 'Create an early purchase order',
    description:
      'Queues an early purchase order for selected funded wishlist items in a managed circle.',
    status: HttpStatus.ACCEPTED,
    responseDescription: 'The queued purchase order.',
  })
  purchaseOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: PurchaseOrderDto,
  ) {
    return this.service.purchaseOrder(id, user, dto);
  }

  @Put(':id/delivery-address')
  @ApiContract({
    summary: 'Save a delivery address',
    description:
      'Encrypts and saves the recipient delivery address for an organizer-owned circle.',
    responseDescription: 'The saved delivery-address status.',
  })
  saveAddress(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SaveDeliveryAddressDto,
  ) {
    return this.service.saveAddress(id, user, dto);
  }

  @Post(':id/delivery-address/confirm')
  @ApiContract({
    summary: 'Confirm a delivery address',
    description:
      'Marks the previously saved encrypted delivery address as confirmed.',
    status: 201,
    responseDescription: 'The confirmed delivery-address status.',
  })
  confirmAddress(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.confirmAddress(id, user);
  }

  @Post(':id/invitations')
  @ApiContract({
    summary: 'Create client invitations',
    description:
      'Creates invitation tokens for the supplied email or phone recipients and returns shareable links.',
    status: 201,
    responseDescription: 'The invitation records and private links.',
  })
  invitations(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ClientCreateInvitationsDto,
  ) {
    return this.service.createInvitations(id, user, dto);
  }
}

@ApiTags('circle invitations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('circle-invitations')
export class ClientInvitationsController {
  constructor(private readonly service: ClientOperationsService) {}

  @Post('accept')
  @ApiContract({
    summary: 'Accept a circle invitation',
    description:
      'Accepts a private invitation token for the authenticated user and records circle membership.',
    status: 201,
    responseDescription: 'The accepted invitation and destination circle.',
  })
  accept(@Body() dto: AcceptCircleInvitationDto, @CurrentUser() user: User) {
    return this.service.acceptInvitation(dto.token, user);
  }
}
