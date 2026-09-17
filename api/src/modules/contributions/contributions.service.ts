import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleActivity } from '../../database/entities/CircleActivity';
import { Contribution } from '../../database/entities/Contribution';
import { ContributionLedgerEntry } from '../../database/entities/ClientOperations';
import { GiftItem } from '../../database/entities/GiftItem';
import { Invitation } from '../../database/entities/Invitation';
import { Notification } from '../../database/entities/Notification';
import { User } from '../../database/entities/User';
import {
  CircleActivityType,
  CirclePrivacy,
  CircleStatus,
  ContributionStatus,
  GiftItemStatus,
  InvitationStatus,
  NotificationType,
  PaymentProvider,
} from '../../database/enums';
import { ConfigService } from '../config/config.service';
import {
  CreateContributionDto,
  PublicContributionsQueryDto,
} from './dto/contribution.dto';
import { PaymentVerification } from '../payment/paystack.client';
import { PaymentService } from '../payment/payment.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ContributionsService {
  constructor(
    @InjectRepository(Circle) private readonly circles: Repository<Circle>,
    @InjectRepository(GiftItem) private readonly items: Repository<GiftItem>,
    @InjectRepository(Contribution)
    private readonly contributions: Repository<Contribution>,
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    private readonly payments: PaymentService,
    private readonly socket: SocketGateway,
    private readonly config: ConfigService,
  ) {}

  async initialize(
    circleId: string,
    dto: CreateContributionDto,
    user?: User | null,
    idempotencyKey?: string,
    clientContract = false,
  ) {
    const modern = clientContract || dto.amountKobo !== undefined;
    const amount = modern
      ? dto.amountKobo === undefined
        ? undefined
        : dto.amountKobo / 100
      : dto.amount;
    if (amount === undefined || amount <= 0) {
      throw new BadRequestException('A valid contribution amount is required');
    }
    if (clientContract && !user) {
      throw new UnauthorizedException(
        'Authentication is required to create a contribution intent',
      );
    }
    if (modern && !user && !dto.payer) {
      throw new BadRequestException(
        'Guest checkout requires payer name and email',
      );
    }
    if (modern && !idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    if (idempotencyKey) {
      const existing = await this.contributions
        .createQueryBuilder('contribution')
        .addSelect('contribution.providerPayload')
        .where('contribution.idempotencyKey = :idempotencyKey', {
          idempotencyKey,
        })
        .getOne();
      if (existing) {
        if (existing.circleId !== circleId) {
          throw new ConflictException('Idempotency key is already in use');
        }
        return modern
          ? this.clientInitialization(existing)
          : this.safeContribution(existing);
      }
    }
    const circle = await this.circles.findOne({ where: { id: circleId } });
    if (!circle) throw new NotFoundException('Circle not found');
    if (circle.isHidden)
      throw new ConflictException('This circle is temporarily unavailable');
    if (circle.status !== CircleStatus.ACTIVE)
      throw new ConflictException('This circle is not accepting contributions');
    if (circle.deadline <= new Date()) {
      circle.status = CircleStatus.EXPIRED;
      await this.circles.save(circle);
      throw new ConflictException('This circle has reached its deadline');
    }
    if (
      circle.privacy === CirclePrivacy.PRIVATE &&
      !(await this.hasPrivateAccess(circleId, dto.invitationCode, user))
    ) {
      throw new ForbiddenException('A valid invitation is required');
    }

    if (
      modern &&
      dto.currency &&
      dto.currency.toUpperCase() !== circle.currency.toUpperCase()
    ) {
      throw new BadRequestException(
        'Contribution currency does not match circle',
      );
    }
    const remaining = Number(circle.targetAmount) - Number(circle.amountRaised);
    if (amount > remaining)
      throw new BadRequestException(
        `The maximum remaining contribution is ${circle.currency} ${remaining.toFixed(2)}`,
      );
    let item: GiftItem | null = null;
    const giftItemId = dto.wishlistItemId ?? dto.giftItemId;
    if (giftItemId) {
      item = await this.items.findOne({
        where: { id: giftItemId, circleId },
      });
      if (!item || item.status !== GiftItemStatus.ACTIVE)
        throw new BadRequestException(
          'Gift item is unavailable or already funded',
        );
      const itemRemaining =
        Number(item.targetAmount) - Number(item.fundedAmount);
      if (amount > itemRemaining)
        throw new BadRequestException({
          code: 'ALLOCATION_EXCEEDS_REMAINING',
          message: `The maximum remaining contribution for this item is ${circle.currency} ${itemRemaining.toFixed(2)}`,
          remainingAmountKobo: Math.round(itemRemaining * 100),
        });
    } else if (!circle.allowGeneralContributions) {
      throw new BadRequestException('Select a gift item for this contribution');
    }

    const email =
      user?.email?.toLowerCase() ??
      dto.payer?.email.toLowerCase() ??
      dto.guestEmail?.toLowerCase();
    if (!email)
      throw new BadRequestException(
        'An email address is required for guest contributions',
      );
    const reference = `GC_${Date.now()}_${randomBytes(6).toString('hex')}`;
    const contribution = await this.contributions.save(
      this.contributions.create({
        circleId,
        contributorId: user?.id ?? null,
        giftItemId: item?.id ?? null,
        guestName: user
          ? null
          : (dto.payer?.displayName ?? dto.guestName ?? null),
        guestEmail: user ? null : email,
        guestPhone: user ? null : (dto.payer?.phone ?? null),
        amount: amount.toFixed(2),
        currency: circle.currency,
        provider: PaymentProvider.PAYSTACK,
        paymentReference: reference,
        idempotencyKey: idempotencyKey ?? null,
        paymentMethod: dto.paymentMethod ?? 'card',
        message: dto.message ?? null,
        showName: modern
          ? !(dto.privacy?.anonymous ?? false)
          : (dto.showName ?? true),
        showAmount: modern
          ? !(dto.privacy?.anonymous || dto.privacy?.hideAmount)
          : (dto.showAmount ?? true),
        showMessage: dto.showMessage ?? true,
      }),
    );

    try {
      const payment = await this.payments.initializeContribution({
        email,
        amount,
        currency: circle.currency,
        reference,
        callbackUrl:
          dto.returnUrl ??
          `${this.config.frontendUrl || 'http://localhost:3000'}/circles/${circle.slug}/payment?reference=${reference}`,
        metadata: {
          contributionId: contribution.id,
          circleId,
          giftItemId: item?.id ?? null,
        },
      });
      contribution.providerPayload = {
        checkout: payment,
        checkoutExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      await this.contributions.save(contribution);
      return modern
        ? this.clientInitialization(contribution)
        : {
            contribution: this.safeContribution(contribution),
            payment,
          };
    } catch (error) {
      contribution.status = ContributionStatus.FAILED;
      await this.contributions.save(contribution);
      throw error;
    }
  }

  async verify(reference: string) {
    const contribution = await this.contributions.findOne({
      where: { paymentReference: reference },
    });
    if (!contribution) throw new NotFoundException('Contribution not found');
    if (contribution.status === ContributionStatus.SUCCESS)
      return this.safeContribution(contribution);
    const verification = await this.payments.verifyContribution(reference);
    return this.applyVerification(reference, verification);
  }

  async handlePaystackEvent(payload: {
    event?: string;
    data?: PaymentVerification;
  }) {
    if (payload.event !== 'charge.success' || !payload.data?.reference)
      return { received: true };
    await this.applyVerification(payload.data.reference, payload.data);
    return { received: true };
  }

  async mine(userId: string, page = 1, limit = 20) {
    limit = Math.min(100, Math.max(1, limit));
    page = Math.max(1, page);
    const [data, total] = await this.contributions.findAndCount({
      where: { contributorId: userId },
      relations: { circle: true, giftItem: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((entry) => ({
        ...this.safeContribution(entry),
        circle: {
          id: entry.circle.id,
          slug: entry.circle.slug,
          title: entry.circle.title,
          recipientName: entry.circle.recipientName,
        },
        giftItem: entry.giftItem
          ? { id: entry.giftItem.id, name: entry.giftItem.name }
          : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async paymentStatus(id: string) {
    const contribution = await this.contributions.findOne({ where: { id } });
    if (!contribution) throw new NotFoundException('Contribution not found');
    return { data: this.clientContribution(contribution) };
  }

  async publicWall(
    circleId: string,
    query: PublicContributionsQueryDto,
    user?: User | null,
  ) {
    const circle = await this.circles.findOne({ where: { id: circleId } });
    if (
      !circle ||
      circle.isHidden ||
      [CircleStatus.DRAFT, CircleStatus.CANCELLED].includes(circle.status)
    ) {
      throw new NotFoundException('Circle not found');
    }
    if (
      circle.privacy === CirclePrivacy.PRIVATE &&
      !(await this.hasPrivateAccess(
        circleId,
        query.invitationToken ?? query.invitationCode,
        user,
      ))
    ) {
      throw new ForbiddenException('A valid invitation is required');
    }
    const offset = this.decodeCursor(query.cursor);
    const qb = this.contributions
      .createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.contributor', 'contributor')
      .leftJoinAndSelect('contribution.giftItem', 'giftItem')
      .where('contribution.circleId = :circleId', { circleId })
      .andWhere('contribution.status = :status', {
        status: ContributionStatus.SUCCESS,
      });
    if (query.hasMessage) {
      qb.andWhere('contribution.message IS NOT NULL')
        .andWhere('contribution.showMessage = true')
        .andWhere('contribution.showName = true');
    }
    const rows = await qb
      .orderBy('contribution.paidAt', 'DESC', 'NULLS LAST')
      .addOrderBy('contribution.id', 'ASC')
      .skip(offset)
      .take(query.limit + 1)
      .getMany();
    const hasMore = rows.length > query.limit;
    return {
      data: rows
        .slice(0, query.limit)
        .map((entry) => this.publicContribution(entry)),
      meta: {
        nextCursor: hasMore ? this.encodeCursor(offset + query.limit) : null,
        hasMore,
      },
    };
  }

  async receipt(id: string) {
    const contribution = await this.contributions.findOne({
      where: { id },
      relations: { circle: true },
    });
    if (!contribution || contribution.status !== ContributionStatus.SUCCESS) {
      throw new NotFoundException('Paid contribution not found');
    }
    return this.createReceiptPdf(contribution);
  }

  private async applyVerification(
    reference: string,
    verification: PaymentVerification,
  ) {
    const result = await this.contributions.manager.transaction(
      async (manager) => {
        const contribution = await manager
          .createQueryBuilder(Contribution, 'contribution')
          .setLock('pessimistic_write')
          .where('contribution.payment_reference = :reference', { reference })
          .getOne();
        if (!contribution)
          throw new NotFoundException('Contribution not found');
        if (contribution.status === ContributionStatus.SUCCESS)
          return this.safeContribution(contribution);
        if (verification.status !== 'success') {
          if (['failed', 'abandoned', 'reversed'].includes(verification.status))
            contribution.status = ContributionStatus.FAILED;
          await manager.save(contribution);
          return this.safeContribution(contribution);
        }
        const expectedMinorAmount = Math.round(
          Number(contribution.amount) * 100,
        );
        if (
          verification.amount !== expectedMinorAmount ||
          verification.currency?.toUpperCase() !==
            contribution.currency.toUpperCase()
        ) {
          contribution.status = ContributionStatus.FAILED;
          contribution.providerPayload = verification as unknown as Record<
            string,
            unknown
          >;
          await manager.save(contribution);
          throw new BadRequestException(
            'Payment amount or currency does not match the contribution',
          );
        }

        const circle = await manager
          .createQueryBuilder(Circle, 'circle')
          .setLock('pessimistic_write')
          .where('circle.id = :id', { id: contribution.circleId })
          .getOne();
        if (!circle) throw new NotFoundException('Circle not found');

        contribution.status = ContributionStatus.SUCCESS;
        contribution.paidAt = verification.paid_at
          ? new Date(verification.paid_at)
          : new Date();
        contribution.providerPayload = verification as unknown as Record<
          string,
          unknown
        >;
        circle.amountRaised = (
          Number(circle.amountRaised) + Number(contribution.amount)
        ).toFixed(2);
        const goalReached =
          Number(circle.amountRaised) >= Number(circle.targetAmount);
        if (goalReached && circle.status === CircleStatus.ACTIVE)
          circle.status = CircleStatus.FUNDED;

        let itemFunded = false;
        if (contribution.giftItemId) {
          const item = await manager
            .createQueryBuilder(GiftItem, 'item')
            .setLock('pessimistic_write')
            .where('item.id = :id', { id: contribution.giftItemId })
            .getOne();
          if (item) {
            item.fundedAmount = Math.min(
              Number(item.targetAmount),
              Number(item.fundedAmount) + Number(contribution.amount),
            ).toFixed(2);
            itemFunded = Number(item.fundedAmount) >= Number(item.targetAmount);
            if (itemFunded) item.status = GiftItemStatus.FUNDED;
            await manager.save(item);
          }
        }

        await manager.save(contribution);
        await manager
          .createQueryBuilder()
          .insert()
          .into(ContributionLedgerEntry)
          .values({
            contributionId: contribution.id,
            circleId: circle.id,
            amount: contribution.amount,
            currency: contribution.currency,
            direction: 'credit',
            status: 'posted',
          })
          .orIgnore()
          .execute();
        const supporterStats = await manager
          .createQueryBuilder(Contribution, 'support')
          .select(
            'COUNT(DISTINCT COALESCE(support.contributor_id::text, support.guest_email, support.id::text))',
            'count',
          )
          .where('support.circle_id = :circleId', { circleId: circle.id })
          .andWhere('support.status = :status', {
            status: ContributionStatus.SUCCESS,
          })
          .getRawOne<{ count: string }>();
        circle.supporterCount = Number(supporterStats?.count ?? 0);
        await manager.save(circle);
        await manager.save(
          manager.create(CircleActivity, {
            circleId: circle.id,
            type: CircleActivityType.CONTRIBUTION_RECEIVED,
            description: `${circle.currency} ${contribution.amount} contributed`,
            metadata: {
              contributionId: contribution.id,
              giftItemId: contribution.giftItemId,
            },
          }),
        );
        if (itemFunded)
          await manager.save(
            manager.create(CircleActivity, {
              circleId: circle.id,
              type: CircleActivityType.ITEM_FUNDED,
              description: 'A gift item was fully funded',
              metadata: { giftItemId: contribution.giftItemId },
            }),
          );
        await manager.save(
          manager.create(Notification, {
            userId: circle.organizerId,
            type: goalReached
              ? NotificationType.GOAL_REACHED
              : NotificationType.CONTRIBUTION_RECEIVED,
            title: goalReached
              ? 'Your GiftCircle reached its goal'
              : 'New GiftCircle contribution',
            message: `${circle.currency} ${contribution.amount} was added to ${circle.title}.`,
            data: { circleId: circle.id, contributionId: contribution.id },
          }),
        );
        return this.safeContribution(contribution);
      },
    );
    if (result.status === ContributionStatus.SUCCESS) {
      this.socket.emitContributionReceived(result.circleId, result);
      const circle = await this.circles.findOne({
        where: { id: result.circleId },
      });
      if (circle) {
        this.socket.emitNotification(circle.organizerId, {
          type: NotificationType.CONTRIBUTION_RECEIVED,
          circleId: circle.id,
          contributionId: result.id,
        });
      }
    }
    return result;
  }

  private async hasPrivateAccess(
    circleId: string,
    code?: string,
    user?: User | null,
  ) {
    if (user) {
      const circle = await this.circles.findOne({ where: { id: circleId } });
      if (circle?.organizerId === user.id) return true;
      if (
        await this.invitations.exists({
          where: {
            circleId,
            acceptedById: user.id,
            status: InvitationStatus.ACCEPTED,
          },
        })
      )
        return true;
    }
    if (!code) return false;
    const invitation = await this.invitations
      .createQueryBuilder('invitation')
      .where('invitation.circleId = :circleId', { circleId })
      .andWhere(
        '(invitation.code = :code OR invitation.tokenHash = :tokenHash)',
        {
          code,
          tokenHash: createHash('sha256').update(code).digest('hex'),
        },
      )
      .getOne();
    return (
      !!invitation &&
      invitation.expiresAt > new Date() &&
      ![InvitationStatus.DECLINED, InvitationStatus.EXPIRED].includes(
        invitation.status,
      )
    );
  }

  private safeContribution(contribution: Contribution) {
    return {
      id: contribution.id,
      circleId: contribution.circleId,
      giftItemId: contribution.giftItemId,
      amount: Number(contribution.amount),
      currency: contribution.currency,
      status: contribution.status,
      paymentReference: contribution.paymentReference,
      message: contribution.message,
      paidAt: contribution.paidAt,
      createdAt: contribution.createdAt,
    };
  }

  private clientInitialization(contribution: Contribution) {
    const payload = contribution.providerPayload ?? {};
    const payment =
      payload.checkout && typeof payload.checkout === 'object'
        ? (payload.checkout as Record<string, unknown>)
        : {};
    const expiresAt =
      typeof payload.checkoutExpiresAt === 'string'
        ? payload.checkoutExpiresAt
        : new Date(Date.now() + 30 * 60 * 1000).toISOString();
    return {
      data: {
        contribution: {
          id: contribution.id,
          reference: contribution.paymentReference,
          status: this.clientStatus(contribution.status),
          amountKobo: Math.round(Number(contribution.amount) * 100),
          currency: contribution.currency,
          wishlistItemId: contribution.giftItemId,
          createdAt: contribution.createdAt,
        },
        checkout: {
          type: 'redirect',
          url:
            typeof payment.authorizationUrl === 'string'
              ? payment.authorizationUrl
              : null,
          expiresAt,
        },
      },
    };
  }

  private clientContribution(contribution: Contribution) {
    return {
      id: contribution.id,
      status: this.clientStatus(contribution.status),
      amountKobo: Math.round(Number(contribution.amount) * 100),
      currency: contribution.currency,
      paidAt: contribution.paidAt,
      paymentMethod: contribution.paymentMethod,
      provider: contribution.provider.toLowerCase(),
      providerReference: contribution.paymentReference,
      receiptUrl:
        contribution.status === ContributionStatus.SUCCESS
          ? `/api/v1/contributions/${contribution.id}/receipt`
          : null,
    };
  }

  private publicContribution(entry: Contribution) {
    const anonymous = !entry.showName;
    const displayName = anonymous
      ? 'Anonymous Supporter'
      : (entry.contributor?.name ?? entry.guestName ?? 'GiftCircle Supporter');
    return {
      id: entry.id,
      displayName,
      initials: anonymous ? '?' : this.initials(displayName),
      amountKobo:
        !anonymous && entry.showAmount
          ? Math.round(Number(entry.amount) * 100)
          : null,
      message: !anonymous && entry.showMessage ? entry.message : null,
      wishlistItem: entry.giftItem
        ? { id: entry.giftItem.id, name: entry.giftItem.name }
        : null,
      anonymous,
      createdAt: entry.paidAt ?? entry.createdAt,
    };
  }

  private clientStatus(status: ContributionStatus) {
    const values: Record<ContributionStatus, string> = {
      [ContributionStatus.PENDING]: 'pending',
      [ContributionStatus.PROCESSING]: 'processing',
      [ContributionStatus.SUCCESS]: 'succeeded',
      [ContributionStatus.FAILED]: 'failed',
      [ContributionStatus.EXPIRED]: 'expired',
      [ContributionStatus.REFUNDED]: 'refunded',
    };
    return values[status];
  }

  private initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private encodeCursor(offset: number) {
    return Buffer.from(JSON.stringify({ offset })).toString('base64url');
  }

  private decodeCursor(cursor?: string) {
    if (!cursor) return 0;
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as { offset?: unknown };
      if (typeof parsed.offset !== 'number' || parsed.offset < 0)
        throw new Error();
      return Math.floor(parsed.offset);
    } catch {
      throw new BadRequestException('Invalid pagination cursor');
    }
  }

  private createReceiptPdf(contribution: Contribution) {
    const escape = (value: string) =>
      value
        .replaceAll('\\', '\\\\')
        .replaceAll('(', '\\(')
        .replaceAll(')', '\\)');
    const lines = [
      'GiftCircle Contribution Receipt',
      `Reference: ${contribution.paymentReference}`,
      `Circle: ${contribution.circle.title}`,
      `Amount: ${contribution.currency} ${contribution.amount}`,
      `Paid: ${contribution.paidAt?.toISOString() ?? ''}`,
      `Signature: ${createHmac('sha256', this.config.jwtSecret)
        .update(
          `${contribution.id}:${contribution.paymentReference}:${contribution.amount}:${contribution.currency}`,
        )
        .digest('hex')}`,
    ];
    const stream = lines
      .map(
        (line, index) =>
          `BT /F1 12 Tf 50 ${760 - index * 24} Td (${escape(line)}) Tj ET`,
      )
      .join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let body = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(body));
      body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(body);
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    body += offsets
      .slice(1)
      .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
      .join('');
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(body);
  }
}
