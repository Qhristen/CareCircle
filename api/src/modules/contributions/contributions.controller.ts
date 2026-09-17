import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { User } from '../../database/entities/User';
import { Response } from 'express';
import { ContributionsService } from './contributions.service';
import {
  CreateContributionIntentDto,
  CreateContributionDto,
  PublicContributionsQueryDto,
} from './dto/contribution.dto';

@ApiTags('contributions')
@Controller()
export class ContributionsController {
  constructor(private readonly service: ContributionsService) {}

  @Post('circles/:circleId/contribution-intents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Makes retries return the same payment intent.',
  })
  @ApiContract({
    summary: 'Initialize a contribution intent',
    description:
      'Uses the authenticated user’s details to create an idempotent payment intent for the client checkout flow.',
    status: 201,
    responseDescription: 'The contribution and provider checkout details.',
  })
  initializeIntent(
    @Param('circleId') circleId: string,
    @Body() dto: CreateContributionIntentDto,
    @CurrentUser() user: User,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.initialize(circleId, dto, user, idempotencyKey, true);
  }

  @Post('circles/:circleId/contributions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiContract({
    summary: 'Initialize a contribution payment',
    description:
      'Validates a guest or member contribution and initializes a provider payment using the legacy response contract.',
    status: 201,
    responseDescription: 'The contribution and provider payment details.',
  })
  initialize(
    @Param('circleId') circleId: string,
    @Body() dto: CreateContributionDto,
    @CurrentUser() user: User | null,
  ) {
    return this.service.initialize(circleId, dto, user);
  }

  @Get('circles/:circleId/contributions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiContract({
    summary: 'List the public contributor wall',
    description:
      'Returns successful contributions whose donor privacy preferences permit them to appear on the circle wall.',
    responseDescription: 'Public contributions and cursor metadata.',
  })
  publicWall(
    @Param('circleId') circleId: string,
    @Query() query: PublicContributionsQueryDto,
    @CurrentUser() user: User | null,
  ) {
    return this.service.publicWall(circleId, query, user);
  }

  @Get('contributions/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'List my contributions',
    description:
      'Returns page-based contribution history for the authenticated contributor.',
    responseDescription: 'The user’s contributions and pagination metadata.',
  })
  mine(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.service.mine(userId, page, limit);
  }

  @Get('contributions/:reference/verify')
  @ApiContract({
    summary: 'Verify a contribution payment',
    description:
      'Checks the provider payment status and applies a successful contribution to its circle exactly once.',
    responseDescription: 'The verified contribution status and allocation.',
  })
  verify(@Param('reference') reference: string) {
    return this.service.verify(reference);
  }

  @Get('contributions/:id/receipt')
  @ApiProduces('application/pdf')
  @ApiContract({
    summary: 'Download a contribution receipt',
    description:
      'Generates a PDF receipt for a successful contribution using its contribution UUID.',
    response: {
      status: 200,
      description: 'A PDF contribution receipt.',
      schema: { type: 'string', format: 'binary' },
    },
  })
  async receipt(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const pdf = await this.service.receipt(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="giftcircle-receipt-${id}.pdf"`,
    );
    return new StreamableFile(pdf);
  }

  @Get('contributions/:id')
  @ApiContract({
    summary: 'Check contribution status',
    description:
      'Returns the current payment and allocation state for a contribution UUID.',
    responseDescription: 'The current contribution status.',
  })
  paymentStatus(@Param('id') id: string) {
    return this.service.paymentStatus(id);
  }
}
