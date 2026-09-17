import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { User } from '../../database/entities/User';
import { CirclesService } from './circles.service';
import {
  CircleListQueryDto,
  CreateCircleDto,
  CreateGiftItemDto,
  ExploreCirclesQueryDto,
  UpdateCircleDto,
} from './dto/circle.dto';
import { ConfirmReceiptDto, UpdateFulfillmentDto } from './dto/fulfillment.dto';
import { UpdateGiftItemDto } from './dto/gift-item.dto';
import { CreateInvitationsDto } from './dto/invitation.dto';
import { CreateCircleUpdateDto, UpdateCircleUpdateDto } from './dto/update.dto';

@ApiTags('circles')
@Controller('circles')
export class CirclesController {
  constructor(private readonly service: CirclesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Create a circle draft',
    description:
      'Creates a circle with recipient, funding, delivery, client-uploaded cover URL, and optional wishlist details.',
    status: 201,
    responseDescription: 'The new draft summary or legacy circle payload.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCircleDto) {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiContract({
    summary: 'Explore published circles',
    description:
      'Returns a cursor-paginated collection of visible community circles, searchable and sortable by circle fields.',
    responseDescription: 'Published circles and cursor metadata.',
  })
  explore(@Query() query: ExploreCirclesQueryDto) {
    return this.service.exploreClient(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'List my circles',
    description:
      'Returns paginated circles organized by the authenticated user, with optional search, occasion, and status filters.',
    responseDescription: 'The organizer’s circles and pagination metadata.',
  })
  mine(@CurrentUser('id') userId: string, @Query() query: CircleListQueryDto) {
    return this.service.listMine(userId, query);
  }

  @Get('discover')
  @ApiContract({
    summary: 'Discover community circles',
    description:
      'Returns the legacy paginated discovery view for active, funded, and fulfilling public circles.',
    responseDescription: 'Community circles and page metadata.',
  })
  discover(@Query() query: CircleListQueryDto) {
    return this.service.discover(query);
  }

  @Get('public/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiContract({
    summary: 'Open a public circle page',
    description:
      'Returns the shareable legacy circle view. Private circles require an invitation code.',
    responseDescription:
      'The public circle, wishlist, progress, and social activity.',
  })
  publicCircle(
    @Param('slug') slug: string,
    @Query('invitationCode') invitationCode: string | undefined,
    @CurrentUser() user: User | null,
  ) {
    return this.service.getPublic(slug, invitationCode, user);
  }

  @Post(':id/confirm-receipt')
  @ApiContract({
    summary: 'Confirm receipt',
    description:
      'Validates the recipient token and marks the circle delivery as received.',
    status: 201,
    responseDescription: 'The completed fulfillment state.',
  })
  confirmReceipt(@Param('id') id: string, @Body() dto: ConfirmReceiptDto) {
    return this.service.confirmReceipt(id, dto.token);
  }

  @Get(':identifier')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiContract({
    summary: 'Get a circle',
    description:
      'Returns the client public detail by slug, or an authenticated accessible circle by UUID. Invitation tokens unlock private circles.',
    responseDescription: 'The requested circle detail and viewer permissions.',
  })
  getOne(
    @Param('identifier') identifier: string,
    @Query('invitationToken') invitationToken: string | undefined,
    @Query('invitationCode') invitationCode: string | undefined,
    @CurrentUser() user: User | null,
  ) {
    if (
      user &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier,
      )
    ) {
      return this.service.getAccessible(identifier, user);
    }
    return this.service.getClientDetail(
      identifier,
      invitationToken ?? invitationCode,
      user,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'If-Match',
    required: false,
    description:
      'Draft version used for optimistic autosave, for example `"3"` or `3`.',
  })
  @ApiContract({
    summary: 'Update a circle',
    description:
      'Updates organizer-owned circle fields. Supplying If-Match uses version-checked draft autosave semantics.',
    responseDescription: 'The updated circle or draft version summary.',
  })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCircleDto,
    @Headers('if-match') ifMatch?: string,
  ) {
    return ifMatch ||
      dto.storyMarkdown !== undefined ||
      dto.closesAt !== undefined
      ? this.service.updateClient(id, user, dto, ifMatch)
      : this.service.update(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Delete a circle draft',
    description:
      'Permanently deletes an organizer-owned circle only while it is still a draft.',
    responseDescription: 'A draft deletion confirmation.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Makes a repeated publish request safe.',
  })
  @ApiContract({
    summary: 'Publish a circle',
    description:
      'Validates the draft and opens it for contributions. A direct coverImageUrl must already be saved.',
    status: 201,
    responseDescription: 'The published circle and share links.',
  })
  publish(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.publish(id, user, idempotencyKey, !!idempotencyKey);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Cancel a circle',
    description:
      'Cancels an organizer-owned circle that has no successful funds requiring a refund.',
    status: 201,
    responseDescription: 'A cancellation confirmation.',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cancel(id, user);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Get the organizer dashboard',
    description:
      'Returns funding totals, contributions, invitations, updates, activity, and fulfillment for one managed circle.',
    responseDescription: 'The complete organizer dashboard payload.',
  })
  dashboard(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.dashboard(id, user);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Add a wishlist item',
    description:
      'Adds an uncategorized gift item to an editable organizer-owned circle.',
    status: 201,
    responseDescription: 'The newly created wishlist item.',
  })
  addItem(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateGiftItemDto,
  ) {
    return this.service.addItem(id, user, dto);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Update a wishlist item',
    description:
      'Updates an editable wishlist item while preventing its target from falling below contributed funds.',
    responseDescription: 'The updated wishlist item.',
  })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateGiftItemDto,
  ) {
    return this.service.updateItem(id, itemId, user, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Delete a wishlist item',
    description:
      'Deletes an unfunded wishlist item from an organizer-owned editable circle.',
    responseDescription: 'A wishlist-item deletion confirmation.',
  })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeItem(id, itemId, user);
  }

  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Create circle invitations',
    description:
      'Creates email or phone invitations for an organizer-owned circle and returns their invitation links.',
    status: 201,
    responseDescription: 'The created invitations.',
  })
  invite(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateInvitationsDto,
  ) {
    return this.service.createInvitations(id, user, dto);
  }

  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'List circle invitations',
    description:
      'Returns invitations and their current delivery and acceptance status for a managed circle.',
    responseDescription: 'The circle invitation collection.',
  })
  invitations(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.listInvitations(id, user);
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Post a circle update',
    description:
      'Publishes an organizer update with an optional client-uploaded image string.',
    status: 201,
    responseDescription: 'The newly published circle update.',
  })
  createUpdate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCircleUpdateDto,
  ) {
    return this.service.createUpdate(id, user, dto);
  }

  @Patch(':id/updates/:updateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Edit a circle update',
    description:
      'Changes the title, message, or client-uploaded image string on an organizer update.',
    responseDescription: 'The edited circle update.',
  })
  updatePost(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCircleUpdateDto,
  ) {
    return this.service.updatePost(id, updateId, user, dto);
  }

  @Delete(':id/updates/:updateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Delete a circle update',
    description: 'Deletes an update from an organizer-owned circle.',
    responseDescription: 'A circle-update deletion confirmation.',
  })
  removePost(
    @Param('id') id: string,
    @Param('updateId') updateId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removePost(id, updateId, user);
  }

  @Patch(':id/fulfillment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Update fulfillment',
    description:
      'Updates delivery status, courier information, tracking details, or a client-uploaded proof image string.',
    responseDescription: 'The updated fulfillment record.',
  })
  fulfillment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateFulfillmentDto,
  ) {
    return this.service.updateFulfillment(id, user, dto);
  }

  @Post(':id/recipient-confirmation-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Regenerate a recipient confirmation link',
    description:
      'Rotates the recipient confirmation token and returns a new private confirmation link.',
    status: 201,
    responseDescription: 'The newly generated recipient confirmation URL.',
  })
  confirmationLink(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.regenerateConfirmationLink(id, user);
  }
}
