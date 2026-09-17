import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createCipheriv, createHash, randomBytes, randomUUID } from 'crypto';
import { Brackets, In, Repository } from 'typeorm';
import {
  CircleBroadcast,
  CircleMembership,
  CircleMessage,
  DeliveryAddressRecord,
  PurchaseOrder,
} from '../../database/entities/ClientOperations';
import { Circle } from '../../database/entities/Circle';
import { Contribution } from '../../database/entities/Contribution';
import { Fulfillment } from '../../database/entities/Fulfillment';
import { GiftItem } from '../../database/entities/GiftItem';
import { Invitation } from '../../database/entities/Invitation';
import { User } from '../../database/entities/User';
import {
  CirclePrivacy,
  CircleStatus,
  ContributionStatus,
  FulfillmentStatus,
  GiftItemStatus,
  InvitationStatus,
  UserRole,
} from '../../database/enums';
import { ConfigService } from '../config/config.service';
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
import { ClientCreateInvitationsDto } from './dto/invitation.dto';

type AuthUser = Pick<User, 'id' | 'email' | 'phone' | 'role'>;

@Injectable()
export class ClientOperationsService {
  constructor(
    @InjectRepository(Circle) private readonly circles: Repository<Circle>,
    @InjectRepository(GiftItem) private readonly items: Repository<GiftItem>,
    @InjectRepository(Contribution)
    private readonly contributions: Repository<Contribution>,
    @InjectRepository(Fulfillment)
    private readonly fulfillments: Repository<Fulfillment>,
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    @InjectRepository(CircleMessage)
    private readonly messages: Repository<CircleMessage>,
    @InjectRepository(CircleBroadcast)
    private readonly broadcasts: Repository<CircleBroadcast>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(CircleMembership)
    private readonly memberships: Repository<CircleMembership>,
    @InjectRepository(DeliveryAddressRecord)
    private readonly addressRecords: Repository<DeliveryAddressRecord>,
    private readonly config: ConfigService,
  ) {}

  async messageOrganizer(circleId: string, dto: CircleMessageDto) {
    const circle = await this.circles.findOne({
      where: { id: circleId },
      relations: { organizer: true },
    });
    if (
      !circle ||
      circle.isHidden ||
      [CircleStatus.DRAFT, CircleStatus.CANCELLED].includes(circle.status)
    ) {
      throw new NotFoundException('Circle not found');
    }
    const message = await this.messages.save(
      this.messages.create({
        circleId,
        contributionId: null,
        kind: 'organizer_message',
        message: dto.message,
        replyEmail: dto.replyEmail.toLowerCase(),
        status: 'queued',
      }),
    );
    return {
      data: {
        id: message.id,
        status: message.status,
        recipient: { displayName: circle.organizer.name },
        createdAt: message.createdAt,
      },
    };
  }

  async dashboard(circleId: string, user: AuthUser) {
    const circle = await this.owned(circleId, user);
    const stats = await this.contributions
      .createQueryBuilder('contribution')
      .select('COUNT(*)', 'contributionCount')
      .addSelect('COALESCE(AVG(contribution.amount), 0)', 'average')
      .addSelect(
        'COUNT(*) FILTER (WHERE contribution.message IS NOT NULL)',
        'blessings',
      )
      .where('contribution.circleId = :circleId', { circleId })
      .andWhere('contribution.status = :status', {
        status: ContributionStatus.SUCCESS,
      })
      .getRawOne<{
        contributionCount: string;
        average: string;
        blessings: string;
      }>();
    const claimedItemCount = (circle.items ?? []).filter(
      (item) => Number(item.fundedAmount) > 0,
    ).length;
    const goalKobo = this.toKobo(circle.targetAmount);
    const raisedKobo = this.toKobo(circle.amountRaised);
    const fulfillment = circle.fulfillment;
    return {
      data: {
        circle: {
          id: circle.id,
          title: circle.title,
          status: this.circleStatus(circle.status),
          privacy: this.privacy(circle.privacy),
          createdAt: circle.createdAt,
        },
        metrics: {
          currency: circle.currency,
          goalKobo,
          raisedKobo,
          remainingKobo: Math.max(0, goalKobo - raisedKobo),
          fundedPercent: goalKobo
            ? Math.min(100, Math.round((raisedKobo / goalKobo) * 100))
            : 0,
          supporterCount: circle.supporterCount ?? 0,
          averageContributionKobo: this.toKobo(stats?.average ?? 0),
          blessingCount: Number(stats?.blessings ?? 0),
          claimedItemCount,
        },
        escrow: {
          status: raisedKobo > 0 ? 'active' : 'pending',
          heldAmountKobo: raisedKobo,
          accountNumberMasked: '******0019',
          partnerName: 'Partner Bank',
          disbursementMode: 'dual_authorization_vendor_settlement',
        },
        fulfillment: {
          stage: this.fulfillmentStage(fulfillment),
          addressStatus: fulfillment?.addressStatus ?? 'pending',
          purchaseOrderStatus:
            fulfillment?.purchaseOrderStatus ?? 'not_requested',
          vendor: {
            id: 'verified-vendor',
            name: 'GiftCircle Verified Vendor',
          },
        },
        updatedAt: circle.updatedAt,
      },
    };
  }

  async contributionRoster(
    circleId: string,
    user: AuthUser,
    query: OrganizerContributionQueryDto,
  ) {
    await this.owned(circleId, user);
    const offset = this.decodeCursor(query.cursor);
    const qb = this.contributions
      .createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.contributor', 'contributor')
      .leftJoinAndSelect('contribution.giftItem', 'giftItem')
      .where('contribution.circleId = :circleId', { circleId });
    if (query.method) {
      qb.andWhere('contribution.paymentMethod = :method', {
        method: query.method,
      });
    }
    if (query.q) {
      qb.andWhere(
        new Brackets((where) =>
          where
            .where('contributor.name ILIKE :q', { q: `%${query.q}%` })
            .orWhere('contributor.email ILIKE :q', { q: `%${query.q}%` })
            .orWhere('contribution.guestName ILIKE :q', {
              q: `%${query.q}%`,
            })
            .orWhere('contribution.guestEmail ILIKE :q', {
              q: `%${query.q}%`,
            })
            .orWhere('contribution.paymentReference ILIKE :q', {
              q: `%${query.q}%`,
            }),
        ),
      );
    }
    const rows = await qb
      .orderBy('contribution.createdAt', 'DESC')
      .addOrderBy('contribution.id', 'ASC')
      .skip(offset)
      .take(query.limit + 1)
      .getMany();
    const hasMore = rows.length > query.limit;
    return {
      data: rows.slice(0, query.limit).map((entry) => ({
        id: entry.id,
        displayName:
          entry.contributor?.name ?? entry.guestName ?? 'Guest Contributor',
        email: entry.contributor?.email ?? entry.guestEmail,
        phone: entry.contributor?.phone ?? entry.guestPhone,
        amountKobo: this.toKobo(entry.amount),
        currency: entry.currency,
        status: this.contributionStatus(entry.status),
        paymentMethod: entry.paymentMethod,
        paymentReference: entry.paymentReference,
        allocation: entry.giftItem
          ? { id: entry.giftItem.id, name: entry.giftItem.name }
          : null,
        note: entry.message,
        paidAt: entry.paidAt,
        createdAt: entry.createdAt,
      })),
      meta: {
        nextCursor: hasMore ? this.encodeCursor(offset + query.limit) : null,
        hasMore,
      },
    };
  }

  async exportContributions(circleId: string, user: AuthUser) {
    await this.owned(circleId, user);
    const rows = await this.contributions.find({
      where: { circleId },
      relations: { contributor: true, giftItem: true },
      order: { createdAt: 'DESC' },
    });
    const csv = [
      [
        'id',
        'name',
        'email',
        'phone',
        'amount_kobo',
        'currency',
        'status',
        'method',
        'reference',
        'wishlist_item',
        'message',
        'paid_at',
      ],
      ...rows.map((entry) => [
        entry.id,
        entry.contributor?.name ?? entry.guestName ?? '',
        entry.contributor?.email ?? entry.guestEmail ?? '',
        entry.contributor?.phone ?? entry.guestPhone ?? '',
        this.toKobo(entry.amount),
        entry.currency,
        this.contributionStatus(entry.status),
        entry.paymentMethod,
        entry.paymentReference,
        entry.giftItem?.name ?? '',
        entry.message ?? '',
        entry.paidAt?.toISOString() ?? '',
      ]),
    ];
    return csv
      .map((row) => row.map((value) => this.csvCell(value)).join(','))
      .join('\n');
  }

  async addWishlistItem(
    circleId: string,
    user: AuthUser,
    dto: ClientWishlistCreateDto,
  ) {
    const circle = await this.owned(circleId, user);
    this.assertEditable(circle);
    const item = await this.items.save(
      this.items.create({
        circleId,
        name: dto.name,
        description: dto.description ?? null,
        emoji: dto.emoji ?? null,
        clientReference: null,
        quantity: 1,
        targetAmount: this.fromKobo(dto.targetAmountKobo),
        fundedAmount: '0.00',
        productUrl: null,
      }),
    );
    const goalKobo = await this.recalculateGoal(circle);
    return { data: { ...this.item(item), goalKobo } };
  }

  async updateWishlistItem(
    circleId: string,
    itemId: string,
    user: AuthUser,
    dto: ClientWishlistUpdateDto,
  ) {
    const circle = await this.owned(circleId, user);
    this.assertEditable(circle);
    const item = await this.items.findOne({ where: { id: itemId, circleId } });
    if (!item) throw new NotFoundException('Wishlist item not found');
    if (
      dto.targetAmountKobo !== undefined &&
      dto.targetAmountKobo < this.toKobo(item.fundedAmount)
    ) {
      throw new BadRequestException(
        'Item target cannot be lower than its funded amount',
      );
    }
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.emoji !== undefined) item.emoji = dto.emoji;
    if (
      dto.targetAmountKobo !== undefined &&
      circle.fundingMode === 'itemized'
    ) {
      const factor = 1 + circle.flexBufferPercent / 100;
      const nextGoal =
        Number(circle.targetAmount) +
        (dto.targetAmountKobo / 100 - Number(item.targetAmount)) * factor;
      if (nextGoal < Number(circle.amountRaised)) {
        throw new ConflictException(
          'Updated item would put the goal below funds already raised',
        );
      }
    }
    if (dto.targetAmountKobo !== undefined) {
      item.targetAmount = this.fromKobo(dto.targetAmountKobo);
    }
    const saved = await this.items.save(item);
    const goalKobo = await this.recalculateGoal(circle);
    return { data: { ...this.item(saved), goalKobo } };
  }

  async removeWishlistItem(circleId: string, itemId: string, user: AuthUser) {
    const circle = await this.owned(circleId, user);
    this.assertEditable(circle);
    const item = await this.items.findOne({ where: { id: itemId, circleId } });
    if (!item) throw new NotFoundException('Wishlist item not found');
    if (
      Number(item.fundedAmount) > 0 ||
      (await this.contributions.exists({
        where: { giftItemId: itemId, status: ContributionStatus.SUCCESS },
      }))
    ) {
      throw new ConflictException('An item with allocations cannot be removed');
    }
    if (circle.fundingMode === 'itemized') {
      const nextGoal =
        (Number(circle.targetAmount) / (1 + circle.flexBufferPercent / 100) -
          Number(item.targetAmount)) *
        (1 + circle.flexBufferPercent / 100);
      if (nextGoal < Number(circle.amountRaised)) {
        throw new ConflictException(
          'Removing this item would put the goal below funds already raised',
        );
      }
    }
    await this.items.remove(item);
    await this.recalculateGoal(circle);
  }

  async settings(circleId: string, user: AuthUser, dto: CircleSettingsDto) {
    const circle = await this.owned(circleId, user);
    circle.privacy = this.toPrivacy(dto.privacy);
    const saved = await this.circles.save(circle);
    return {
      data: {
        privacy: this.privacy(saved.privacy),
        updatedAt: saved.updatedAt,
      },
    };
  }

  async thank(
    circleId: string,
    contributionId: string,
    user: AuthUser,
    dto: ThankContributorDto,
  ) {
    await this.owned(circleId, user);
    const contribution = await this.contributions.findOne({
      where: { id: contributionId, circleId },
      relations: { contributor: true },
    });
    if (!contribution) throw new NotFoundException('Contribution not found');
    const message = await this.messages.save(
      this.messages.create({
        circleId,
        contributionId,
        kind: 'contributor_thanks',
        message: dto.message,
        replyEmail: contribution.contributor?.email ?? contribution.guestEmail,
        status: 'queued',
      }),
    );
    return {
      data: {
        id: message.id,
        status: message.status,
        createdAt: message.createdAt,
      },
    };
  }

  async broadcast(circleId: string, user: AuthUser, dto: BroadcastDto) {
    const circle = await this.owned(circleId, user);
    const channels = Object.fromEntries(
      dto.channels.map((channel) => [channel, 'queued']),
    );
    const broadcast = await this.broadcasts.save(
      this.broadcasts.create({
        circleId,
        message: dto.message,
        channels,
        status: 'queued',
        recipientCount: circle.supporterCount ?? 0,
      }),
    );
    return {
      data: {
        id: broadcast.id,
        status: broadcast.status,
        recipientCount: broadcast.recipientCount,
        channels: broadcast.channels,
        createdAt: broadcast.createdAt,
      },
    };
  }

  async purchaseOrder(circleId: string, user: AuthUser, dto: PurchaseOrderDto) {
    await this.owned(circleId, user);
    const count = await this.items.count({
      where: { id: In(dto.wishlistItemIds), circleId },
    });
    if (count !== new Set(dto.wishlistItemIds).size) {
      throw new BadRequestException('One or more wishlist items are invalid');
    }
    const order = await this.purchaseOrders.save(
      this.purchaseOrders.create({
        circleId,
        type: dto.type,
        wishlistItemIds: [...new Set(dto.wishlistItemIds)],
        status: 'under_review',
      }),
    );
    await this.fulfillments.update(
      { circleId },
      { purchaseOrderStatus: 'under_review' },
    );
    return { data: order };
  }

  async saveAddress(
    circleId: string,
    user: AuthUser,
    dto: SaveDeliveryAddressDto,
  ) {
    const circle = await this.owned(circleId, user);
    const existing = await this.addressRecords.findOne({ where: { circleId } });
    const record = existing ?? this.addressRecords.create({ circleId });
    record.encryptedPayload = this.encrypt(dto);
    record.status = 'saved';
    record.confirmedAt = null;
    const saved = await this.addressRecords.save(record);
    circle.recipientCity = dto.city;
    circle.deliveryCollectionMode = 'provide_now';
    await this.circles.save(circle);
    await this.fulfillments.update({ circleId }, { addressStatus: 'saved' });
    return {
      data: {
        id: saved.id,
        status: saved.status,
        encrypted: true,
        updatedAt: saved.updatedAt,
      },
    };
  }

  async confirmAddress(circleId: string, user: AuthUser) {
    await this.owned(circleId, user);
    const record = await this.addressRecords.findOne({ where: { circleId } });
    if (!record) throw new NotFoundException('Delivery address not found');
    record.status = 'confirmed';
    record.confirmedAt = new Date();
    const saved = await this.addressRecords.save(record);
    await this.fulfillments.update(
      { circleId },
      { addressStatus: 'confirmed' },
    );
    return {
      data: {
        id: saved.id,
        status: saved.status,
        confirmedAt: saved.confirmedAt,
      },
    };
  }

  async createInvitations(
    circleId: string,
    user: AuthUser,
    dto: ClientCreateInvitationsDto,
  ) {
    const circle = await this.owned(circleId, user);
    if (circle.privacy !== CirclePrivacy.PRIVATE) {
      throw new ConflictException('Invitations require invite-only privacy');
    }
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : circle.deadline;
    if (expiresAt <= new Date() || expiresAt > circle.deadline) {
      throw new BadRequestException(
        'Invitation expiry must be before the circle closes',
      );
    }
    const batchId = randomUUID();
    const created: Array<{ invitation: Invitation; token: string }> = [];
    for (const recipient of dto.recipients) {
      this.assertInvitationValue(recipient.channel, recipient.value);
      const token = randomBytes(32).toString('base64url');
      const email =
        recipient.channel === 'email' ? recipient.value.toLowerCase() : null;
      const phone = recipient.channel === 'sms' ? recipient.value : null;
      const invitation = await this.invitations.save(
        this.invitations.create({
          circleId,
          email,
          phone,
          code: this.hash(`${batchId}:${recipient.value}`).slice(0, 64),
          tokenHash: this.hash(token),
          batchId,
          channel: recipient.channel,
          message: dto.message ?? null,
          expiresAt,
        }),
      );
      created.push({ invitation, token });
    }
    return {
      data: {
        batchId,
        created: created.length,
        failed: 0,
        invitations: created.map(({ invitation, token }) => ({
          id: invitation.id,
          maskedRecipient: this.mask(
            invitation.email ?? invitation.phone ?? '',
          ),
          status: 'queued',
          invitationUrl: `${this.config.frontendUrl || 'http://localhost:3000'}/circles/${circle.slug}?invitationToken=${encodeURIComponent(token)}`,
        })),
      },
    };
  }

  async acceptInvitation(token: string, user: AuthUser) {
    const tokenHash = this.hash(token);
    const invitation = await this.invitations
      .createQueryBuilder('invitation')
      .addSelect('invitation.tokenHash')
      .leftJoinAndSelect('invitation.circle', 'circle')
      .where('invitation.tokenHash = :tokenHash', { tokenHash })
      .getOne();
    if (
      !invitation ||
      invitation.expiresAt <= new Date() ||
      invitation.status !== InvitationStatus.PENDING
    ) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }
    if (
      invitation.email &&
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new ForbiddenException('This invitation belongs to another email');
    }
    if (invitation.phone && invitation.phone !== user.phone) {
      throw new ForbiddenException('This invitation belongs to another phone');
    }
    let membership = await this.memberships.findOne({
      where: { circleId: invitation.circleId, userId: user.id },
    });
    if (!membership) {
      membership = await this.memberships.save(
        this.memberships.create({
          circleId: invitation.circleId,
          userId: user.id,
          invitationId: invitation.id,
          role: 'contributor',
          status: 'active',
        }),
      );
    }
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();
    invitation.tokenHash = null;
    await this.invitations.save(invitation);
    return {
      data: {
        circleId: invitation.circleId,
        membershipId: membership.id,
        role: membership.role,
        status: membership.status,
        redirectUrl: `/circles/${invitation.circle.slug}`,
      },
    };
  }

  private async owned(id: string, user: AuthUser) {
    const circle = await this.circles.findOne({
      where: { id },
      relations: { items: true, fulfillment: true },
    });
    if (!circle) throw new NotFoundException('Circle not found');
    if (circle.organizerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the organizer can perform this action',
      );
    }
    return circle;
  }

  private assertEditable(circle: Circle) {
    if (
      ![CircleStatus.DRAFT, CircleStatus.ACTIVE, CircleStatus.FUNDED].includes(
        circle.status,
      )
    ) {
      throw new ConflictException('Circle can no longer be edited');
    }
  }

  private async recalculateGoal(circle: Circle) {
    if (circle.fundingMode !== 'itemized')
      return this.toKobo(circle.targetAmount);
    const result = await this.items
      .createQueryBuilder('item')
      .select('COALESCE(SUM(item.targetAmount), 0)', 'subtotal')
      .where('item.circleId = :circleId', { circleId: circle.id })
      .getRawOne<{ subtotal: string }>();
    const subtotalKobo = this.toKobo(result?.subtotal ?? 0);
    const goalKobo =
      subtotalKobo +
      Math.round((subtotalKobo * circle.flexBufferPercent) / 100);
    const goal = goalKobo / 100;
    if (goal < Number(circle.amountRaised)) {
      throw new ConflictException(
        'Recalculated goal cannot be lower than funds already raised',
      );
    }
    circle.targetAmount = this.fromKobo(goalKobo);
    const saved = await this.circles.save(circle);
    return this.toKobo(saved.targetAmount);
  }

  private item(item: GiftItem) {
    return {
      id: item.id,
      emoji: item.emoji,
      name: item.name,
      description: item.description,
      targetAmountKobo: this.toKobo(item.targetAmount),
      fundedAmountKobo: this.toKobo(item.fundedAmount),
      status:
        item.status === GiftItemStatus.FUNDED
          ? 'funded'
          : item.status.toLowerCase(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private fulfillmentStage(fulfillment?: Fulfillment | null) {
    if (!fulfillment || fulfillment.status === FulfillmentStatus.PENDING)
      return 'funding';
    if (fulfillment.status === FulfillmentStatus.CONFIRMED) return 'complete';
    if (
      [FulfillmentStatus.IN_TRANSIT, FulfillmentStatus.DELIVERED].includes(
        fulfillment.status,
      )
    )
      return 'delivery';
    return 'purchasing';
  }

  private privacy(value: CirclePrivacy) {
    return value === CirclePrivacy.PRIVATE
      ? 'invite'
      : value === CirclePrivacy.COMMUNITY
        ? 'public'
        : 'link';
  }

  private toPrivacy(value: 'link' | 'invite' | 'public') {
    return value === 'invite'
      ? CirclePrivacy.PRIVATE
      : value === 'public'
        ? CirclePrivacy.COMMUNITY
        : CirclePrivacy.LINK_ONLY;
  }

  private circleStatus(status: CircleStatus) {
    return status === CircleStatus.ACTIVE ? 'published' : status.toLowerCase();
  }

  private contributionStatus(status: ContributionStatus) {
    return status === ContributionStatus.SUCCESS
      ? 'succeeded'
      : status.toLowerCase();
  }

  private encrypt(value: object) {
    const key = createHash('sha256').update(this.config.jwtSecret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  private assertInvitationValue(channel: string, value: string) {
    const valid =
      channel === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        : /^\+[1-9]\d{7,14}$/.test(value);
    if (!valid) throw new BadRequestException(`Invalid ${channel} recipient`);
  }

  private mask(value: string) {
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local?.slice(0, 1) ?? ''}***@${domain ?? ''}`;
    }
    return `${value.slice(0, 4)}******${value.slice(-2)}`;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private fromKobo(value: number) {
    return (value / 100).toFixed(2);
  }

  private toKobo(value: string | number) {
    return Math.round(Number(value) * 100);
  }

  private encodeCursor(offset: number) {
    return Buffer.from(JSON.stringify({ offset })).toString('base64url');
  }

  private decodeCursor(cursor?: string) {
    if (!cursor) return 0;
    try {
      const value = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as { offset?: unknown };
      if (typeof value.offset !== 'number' || value.offset < 0)
        throw new Error();
      return Math.floor(value.offset);
    } catch {
      throw new BadRequestException('Invalid pagination cursor');
    }
  }

  private csvCell(value: unknown) {
    const string =
      value === null || value === undefined
        ? ''
        : typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);
    return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
  }
}
