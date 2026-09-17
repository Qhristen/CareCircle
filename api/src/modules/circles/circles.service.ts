import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { Brackets, EntityManager, ILike, Repository } from 'typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleActivity } from '../../database/entities/CircleActivity';
import { CircleUpdate } from '../../database/entities/CircleUpdate';
import { Contribution } from '../../database/entities/Contribution';
import { Fulfillment } from '../../database/entities/Fulfillment';
import { GiftItem } from '../../database/entities/GiftItem';
import { Invitation } from '../../database/entities/Invitation';
import { User } from '../../database/entities/User';
import { DeliveryAddressRecord } from '../../database/entities/ClientOperations';
import {
  CircleActivityType,
  CircleOccasion,
  CirclePrivacy,
  CircleStatus,
  ContributionStatus,
  FulfillmentStatus,
  InvitationStatus,
  NotificationType,
  UserRole,
} from '../../database/enums';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../socket/socket.gateway';
import {
  CircleListQueryDto,
  CreateCircleDto,
  CreateGiftItemDto,
  ExploreCirclesQueryDto,
  UpdateCircleDto,
} from './dto/circle.dto';
import { UpdateFulfillmentDto } from './dto/fulfillment.dto';
import { UpdateGiftItemDto } from './dto/gift-item.dto';
import { CreateInvitationsDto } from './dto/invitation.dto';
import { CreateCircleUpdateDto, UpdateCircleUpdateDto } from './dto/update.dto';

export type AuthUser = Pick<User, 'id' | 'email' | 'phone' | 'role'>;

@Injectable()
export class CirclesService {
  constructor(
    @InjectRepository(Circle) private readonly circles: Repository<Circle>,
    @InjectRepository(GiftItem) private readonly items: Repository<GiftItem>,
    @InjectRepository(Contribution)
    private readonly contributions: Repository<Contribution>,
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    @InjectRepository(CircleUpdate)
    private readonly updates: Repository<CircleUpdate>,
    @InjectRepository(Fulfillment)
    private readonly fulfillments: Repository<Fulfillment>,
    private readonly notifications: NotificationService,
    private readonly socket: SocketGateway,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateCircleDto) {
    if (dto.recipient || dto.funding || dto.wishlist || dto.delivery) {
      return this.createClient(userId, dto);
    }
    if (
      !dto.title ||
      !dto.occasion ||
      !dto.recipientName ||
      dto.targetAmount === undefined ||
      !dto.deadline ||
      !dto.deliveryAddress
    ) {
      throw new BadRequestException('Missing required circle fields');
    }
    const deadline = new Date(dto.deadline);
    this.assertFutureDeadline(deadline);
    const recipientToken = randomBytes(32).toString('hex');

    const circle = await this.circles.manager.transaction(async (manager) => {
      const entity = manager.create(Circle, {
        organizerId: userId,
        slug: await this.uniqueSlug(dto.title!, manager),
        title: dto.title,
        occasion: this.toOccasion(dto.occasion!),
        story: dto.story ?? null,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail?.toLowerCase() ?? null,
        recipientPhone: dto.recipientPhone ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        privacy: this.toPrivacy(dto.privacy),
        targetAmount: this.money(dto.targetAmount!),
        amountRaised: '0.00',
        currency: (dto.currency ?? 'NGN').toUpperCase(),
        deadline,
        deliveryAddress: dto.deliveryAddress,
        allowGeneralContributions: dto.allowGeneralContributions ?? true,
        recipientTokenHash: this.hash(recipientToken),
      });
      const saved = await manager.save(entity);
      if (dto.items?.length) {
        saved.items = await manager.save(
          dto.items.map((item) =>
            this.createItemEntity(saved.id, item, manager),
          ),
        );
      } else {
        saved.items = [];
      }
      saved.fulfillment = await manager.save(
        manager.create(Fulfillment, {
          circleId: saved.id,
          deliveryAddress: saved.deliveryAddress,
        }),
      );
      await this.addActivity(
        manager,
        saved.id,
        CircleActivityType.CIRCLE_CREATED,
        'Circle created',
      );
      return saved;
    });

    const response = {
      ...this.circleData(circle),
      items: circle.items.map((item) => this.circleItem(item)),
    };
    return {
      ...response,
      shareUrl: this.shareUrl(circle.slug),
      recipientConfirmationUrl: this.confirmationUrl(circle.id, recipientToken),
    };
  }

  private async createClient(userId: string, dto: CreateCircleDto) {
    if (
      !dto.title ||
      !dto.occasion ||
      !dto.recipient ||
      !dto.funding ||
      !dto.closesAt ||
      !dto.delivery
    ) {
      throw new BadRequestException('Missing required circle draft fields');
    }
    const wishlist = dto.wishlist ?? [];
    const subtotalKobo =
      dto.funding.mode === 'itemized'
        ? wishlist.reduce((total, item) => total + item.targetAmountKobo, 0)
        : (dto.funding.cashGoalKobo ?? 0);
    if (subtotalKobo < 1) {
      throw new BadRequestException(
        dto.funding.mode === 'itemized'
          ? 'At least one wishlist target is required'
          : 'A cash goal is required',
      );
    }
    const bufferPercent = dto.funding.flexBufferPercent ?? 0;
    const flexBufferKobo = Math.round((subtotalKobo * bufferPercent) / 100);
    const goalKobo = subtotalKobo + flexBufferKobo;
    const deadline = new Date(dto.closesAt);
    this.assertFutureDeadline(deadline);
    const recipientToken = randomBytes(32).toString('hex');

    const circle = await this.circles.manager.transaction(async (manager) => {
      const entity = manager.create(Circle, {
        organizerId: userId,
        slug: await this.uniqueSlug(dto.title!, manager),
        title: dto.title!.trim(),
        occasion: this.toOccasion(dto.occasion!),
        story: dto.storyMarkdown ?? null,
        recipientName: dto.recipient!.fullName,
        recipientRelationship: dto.recipient!.relationship,
        recipientCity:
          dto.recipient!.city ?? dto.delivery!.address?.city ?? null,
        recipientCountryCode: dto.recipient!.countryCode?.toUpperCase() ?? 'NG',
        recipientEmail: null,
        recipientPhone: null,
        coverAssetId: null,
        coverImageUrl: dto.coverImageUrl ?? null,
        coverAlt: dto.coverAlt ?? dto.title!,
        privacy: this.toPrivacy(dto.privacy),
        targetAmount: this.fromKobo(goalKobo),
        amountRaised: '0.00',
        currency: dto.funding!.currency.toUpperCase(),
        fundingMode: dto.funding!.mode,
        flexBufferPercent: bufferPercent,
        deadline,
        deliveryAddress: null,
        deliveryCollectionMode: dto.delivery!.collectionMode,
        allowGeneralContributions: true,
        recipientTokenHash: this.hash(recipientToken),
      });
      const saved = await manager.save(entity);
      saved.items = wishlist.length
        ? await manager.save(
            wishlist.map((item) =>
              manager.create(GiftItem, {
                circleId: saved.id,
                clientReference: item.clientReference ?? null,
                emoji: item.emoji ?? null,
                name: item.name,
                description: item.description ?? null,
                quantity: 1,
                targetAmount: this.fromKobo(item.targetAmountKobo),
                fundedAmount: '0.00',
                productUrl: null,
              }),
            ),
          )
        : [];
      saved.fulfillment = await manager.save(
        manager.create(Fulfillment, {
          circleId: saved.id,
          deliveryAddress: null,
          addressStatus: dto.delivery!.address ? 'saved' : 'pending',
        }),
      );
      if (dto.delivery!.address) {
        await manager.save(
          manager.create(DeliveryAddressRecord, {
            circleId: saved.id,
            encryptedPayload: this.encryptAddress(dto.delivery!.address),
            status: 'saved',
            confirmedAt: null,
          }),
        );
      }
      await this.addActivity(
        manager,
        saved.id,
        CircleActivityType.CIRCLE_CREATED,
        'Circle created',
      );
      return saved;
    });
    return {
      data: this.clientDraftSummary(
        circle,
        subtotalKobo,
        flexBufferKobo,
        goalKobo,
      ),
    };
  }

  async exploreClient(query: ExploreCirclesQueryDto) {
    const offset = this.decodeCursor(query.cursor);
    const qb = this.circles
      .createQueryBuilder('circle')
      .leftJoinAndSelect('circle.organizer', 'organizer')
      .leftJoinAndSelect('circle.items', 'item')
      .where('circle.privacy = :privacy', { privacy: CirclePrivacy.COMMUNITY })
      .andWhere('circle.isHidden = false')
      .andWhere('circle.status IN (:...statuses)', {
        statuses: [
          CircleStatus.ACTIVE,
          CircleStatus.FUNDED,
          CircleStatus.FULFILLING,
        ],
      })
      .andWhere(
        '(circle.deadline > :now OR circle.status IN (:...postFunding))',
        {
          now: new Date(),
          postFunding: [CircleStatus.FUNDED, CircleStatus.FULFILLING],
        },
      );
    if (query.q) {
      qb.andWhere(
        new Brackets((where) =>
          where
            .where('circle.title ILIKE :q', { q: `%${query.q}%` })
            .orWhere('circle.story ILIKE :q', { q: `%${query.q}%` })
            .orWhere('circle.recipientName ILIKE :q', { q: `%${query.q}%` })
            .orWhere('circle.recipientCity ILIKE :q', { q: `%${query.q}%` })
            .orWhere('organizer.name ILIKE :q', { q: `%${query.q}%` })
            .orWhere('item.name ILIKE :q', { q: `%${query.q}%` }),
        ),
      );
    }
    if (query.minFundedPercent !== undefined) {
      qb.andWhere(
        '(circle.amountRaised * 100 / NULLIF(circle.targetAmount, 0)) >= :minimum',
        { minimum: query.minFundedPercent },
      );
    }
    switch (query.sort) {
      case 'ending':
        qb.orderBy('circle.deadline', 'ASC');
        break;
      case 'funded':
        qb.orderBy(
          '(circle.amountRaised / NULLIF(circle.targetAmount, 0))',
          'DESC',
        );
        break;
      case 'recent':
        qb.orderBy('circle.publishedAt', 'DESC', 'NULLS LAST');
        break;
      default:
        qb.orderBy('circle.updatedAt', 'DESC');
    }
    qb.addOrderBy('circle.id', 'ASC')
      .skip(offset)
      .take(query.limit + 1);
    const rows = await qb.getMany();
    const hasMore = rows.length > query.limit;
    const data = rows
      .slice(0, query.limit)
      .map((circle) => this.clientExploreCircle(circle));
    return {
      data,
      meta: {
        nextCursor: hasMore ? this.encodeCursor(offset + query.limit) : null,
        hasMore,
      },
    };
  }

  async listMine(userId: string, query: CircleListQueryDto) {
    const where: Record<string, unknown> = { organizerId: userId };
    if (query.status) where.status = query.status;
    if (query.occasion) where.occasion = query.occasion;
    if (query.search) where.title = ILike(`%${query.search}%`);
    const [data, total] = await this.circles.findAndCount({
      where,
      relations: { items: true, fulfillment: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.paginated(
      data.map((circle) => this.withProgress(circle)),
      total,
      query.page,
      query.limit,
    );
  }

  async discover(query: CircleListQueryDto) {
    const qb = this.circles
      .createQueryBuilder('circle')
      .leftJoinAndSelect('circle.items', 'item')
      .leftJoinAndSelect('circle.organizer', 'organizer')
      .where('circle.privacy = :privacy', { privacy: CirclePrivacy.COMMUNITY })
      .andWhere('circle.isHidden = false')
      .andWhere('circle.status IN (:...statuses)', {
        statuses: [
          CircleStatus.ACTIVE,
          CircleStatus.FUNDED,
          CircleStatus.FULFILLING,
        ],
      })
      .andWhere(
        'circle.deadline > :now OR circle.status IN (:...postFunding)',
        {
          now: new Date(),
          postFunding: [CircleStatus.FUNDED, CircleStatus.FULFILLING],
        },
      );
    if (query.search) {
      qb.andWhere(
        new Brackets((where) =>
          where
            .where('circle.title ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('circle.story ILIKE :search', {
              search: `%${query.search}%`,
            }),
        ),
      );
    }
    if (query.occasion)
      qb.andWhere('circle.occasion = :occasion', { occasion: query.occasion });
    const [data, total] = await qb
      .orderBy('circle.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return this.paginated(
      data.map((circle) => this.publicCircle(circle)),
      total,
      query.page,
      query.limit,
    );
  }

  async getPublic(
    slug: string,
    invitationCode?: string,
    user?: AuthUser | null,
  ) {
    const circle = await this.circles.findOne({
      where: { slug },
      relations: {
        organizer: true,
        items: true,
        updates: { author: true },
        activities: true,
        fulfillment: true,
        contributions: { contributor: true, giftItem: true },
      },
      order: {
        updates: { createdAt: 'DESC' },
        activities: { createdAt: 'DESC' },
        contributions: { paidAt: 'DESC' },
      },
    });
    if (
      !circle ||
      circle.status === CircleStatus.DRAFT ||
      circle.status === CircleStatus.CANCELLED ||
      (circle.isHidden &&
        circle.organizerId !== user?.id &&
        user?.role !== UserRole.ADMIN)
    ) {
      throw new NotFoundException('Circle not found');
    }
    if (circle.privacy === CirclePrivacy.PRIVATE) {
      const hasAccess = await this.hasPrivateAccess(
        circle.id,
        invitationCode,
        user,
      );
      if (!hasAccess)
        throw new ForbiddenException('A valid invitation is required');
    }
    return this.publicCircle(circle, true);
  }

  async getClientDetail(
    slug: string,
    invitationCode?: string,
    user?: AuthUser | null,
  ) {
    const circle = await this.circles.findOne({
      where: { slug },
      relations: {
        organizer: true,
        items: true,
        fulfillment: true,
      },
      order: { items: { createdAt: 'ASC' } },
    });
    if (
      !circle ||
      circle.status === CircleStatus.DRAFT ||
      circle.status === CircleStatus.CANCELLED ||
      (circle.isHidden &&
        circle.organizerId !== user?.id &&
        user?.role !== UserRole.ADMIN)
    ) {
      throw new NotFoundException('Circle not found');
    }
    if (
      circle.privacy === CirclePrivacy.PRIVATE &&
      !(await this.hasPrivateAccess(circle.id, invitationCode, user))
    ) {
      throw new ForbiddenException('A valid invitation is required');
    }
    const canManage =
      circle.organizerId === user?.id || user?.role === UserRole.ADMIN;
    return { data: this.clientCircleDetail(circle, canManage) };
  }

  async getAccessible(id: string, user: AuthUser) {
    const circle = await this.circles.findOne({
      where: { id },
      relations: {
        items: true,
        updates: { author: true },
        activities: true,
        fulfillment: true,
      },
      order: {
        updates: { createdAt: 'DESC' },
        activities: { createdAt: 'DESC' },
      },
    });
    if (!circle) throw new NotFoundException('Circle not found');
    if (circle.organizerId !== user.id && user.role !== UserRole.ADMIN) {
      const [contributed, invited] = await Promise.all([
        this.contributions.exists({
          where: {
            circleId: id,
            contributorId: user.id,
            status: ContributionStatus.SUCCESS,
          },
        }),
        this.invitations.exists({
          where: {
            circleId: id,
            acceptedById: user.id,
            status: InvitationStatus.ACCEPTED,
          },
        }),
      ]);
      if (!contributed && !invited && circle.privacy === CirclePrivacy.PRIVATE)
        throw new ForbiddenException();
    }
    return {
      ...this.withProgress(circle),
      shareUrl: this.shareUrl(circle.slug),
    };
  }

  async update(id: string, user: AuthUser, dto: UpdateCircleDto) {
    const circle = await this.owned(id, user);
    this.assertCircleEditable(circle);
    if (dto.deadline) this.assertFutureDeadline(new Date(dto.deadline));
    if (
      dto.targetAmount !== undefined &&
      dto.targetAmount < Number(circle.amountRaised)
    ) {
      throw new BadRequestException(
        'Target amount cannot be lower than the amount already raised',
      );
    }
    const oldGoal = circle.targetAmount;
    const updates = { ...dto };
    delete updates.storyMarkdown;
    delete updates.closesAt;
    Object.assign(circle, {
      ...updates,
      occasion: dto.occasion ? this.toOccasion(dto.occasion) : circle.occasion,
      privacy: dto.privacy ? this.toPrivacy(dto.privacy) : circle.privacy,
      story: dto.storyMarkdown ?? dto.story ?? circle.story,
      coverImageUrl: dto.coverImageUrl ?? circle.coverImageUrl,
      targetAmount:
        dto.targetAmount === undefined
          ? circle.targetAmount
          : this.money(dto.targetAmount),
      deadline: dto.closesAt
        ? new Date(dto.closesAt)
        : dto.deadline
          ? new Date(dto.deadline)
          : circle.deadline,
      recipientEmail:
        dto.recipientEmail?.toLowerCase() ?? circle.recipientEmail,
      currency: circle.currency,
    });
    const saved = await this.circles.save(circle);
    if (oldGoal !== saved.targetAmount) {
      await this.addActivity(
        this.circles.manager,
        id,
        CircleActivityType.GOAL_UPDATED,
        `Goal updated to ${saved.currency} ${saved.targetAmount}`,
      );
    }
    const response = this.withProgress(saved);
    this.socket.emitCircleUpdated(id, response);
    return response;
  }

  async updateClient(
    id: string,
    user: AuthUser,
    dto: UpdateCircleDto,
    ifMatch?: string,
  ) {
    const circle = await this.owned(id, user);
    if (circle.status !== CircleStatus.DRAFT) {
      throw new ConflictException('Only draft circles can be autosaved');
    }
    const expectedVersion = this.parseVersion(ifMatch);
    if (expectedVersion === null || expectedVersion !== circle.version) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'The draft has been updated elsewhere',
        currentVersion: circle.version,
      });
    }
    if (dto.closesAt) this.assertFutureDeadline(new Date(dto.closesAt));
    const oldGoal = circle.targetAmount;
    const mutable: Pick<
      Partial<Circle>,
      | 'title'
      | 'story'
      | 'privacy'
      | 'deadline'
      | 'coverImageUrl'
      | 'recipientName'
    > = {};
    if (dto.title !== undefined) mutable.title = dto.title;
    if (dto.storyMarkdown !== undefined) mutable.story = dto.storyMarkdown;
    if (dto.story !== undefined) mutable.story = dto.story;
    if (dto.privacy !== undefined)
      mutable.privacy = this.toPrivacy(dto.privacy);
    if (dto.closesAt !== undefined) mutable.deadline = new Date(dto.closesAt);
    if (dto.deadline !== undefined) mutable.deadline = new Date(dto.deadline);
    if (dto.coverImageUrl !== undefined)
      mutable.coverImageUrl = dto.coverImageUrl;
    if (dto.recipientName !== undefined)
      mutable.recipientName = dto.recipientName;
    Object.assign(circle, mutable);
    const result = await this.circles
      .createQueryBuilder()
      .update(Circle)
      .set({ ...mutable, version: () => 'version + 1' })
      .where('id = :id', { id })
      .andWhere('version = :version', { version: expectedVersion })
      .execute();
    if (!result.affected) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'The draft has been updated elsewhere',
      });
    }
    const saved = await this.circles.findOneByOrFail({ id });
    if (oldGoal !== saved.targetAmount) {
      await this.addActivity(
        this.circles.manager,
        id,
        CircleActivityType.GOAL_UPDATED,
        `Goal updated to ${saved.currency} ${saved.targetAmount}`,
      );
    }
    return {
      data: {
        id: saved.id,
        status: this.clientStatus(saved.status),
        version: saved.version,
        updatedAt: saved.updatedAt,
      },
    };
  }

  async publish(
    id: string,
    user: AuthUser,
    idempotencyKey?: string,
    clientContract = false,
  ) {
    const circle = await this.owned(id, user);
    if (
      circle.status !== CircleStatus.DRAFT &&
      idempotencyKey &&
      circle.publishIdempotencyKey === idempotencyKey
    ) {
      return clientContract
        ? { data: this.clientPublishedSummary(circle) }
        : {
            ...this.withProgress(circle),
            shareUrl: this.shareUrl(circle.slug),
          };
    }
    if (circle.status !== CircleStatus.DRAFT)
      throw new ConflictException('Only draft circles can be published');
    this.assertFutureDeadline(circle.deadline);
    if (circle.fundingMode) this.assertClientPublishable(circle);
    circle.status = CircleStatus.ACTIVE;
    circle.publishedAt = new Date();
    circle.publishIdempotencyKey = idempotencyKey ?? null;
    await this.circles.save(circle);
    await this.addActivity(
      this.circles.manager,
      id,
      CircleActivityType.CIRCLE_PUBLISHED,
      'Circle opened for contributions',
    );
    this.socket.emitCircleUpdated(id, this.withProgress(circle));
    const legacy = {
      ...this.withProgress(circle),
      shareUrl: this.shareUrl(circle.slug),
    };
    return clientContract
      ? { data: this.clientPublishedSummary(circle) }
      : legacy;
  }

  async cancel(id: string, user: AuthUser) {
    const circle = await this.owned(id, user);
    if (
      [CircleStatus.COMPLETED, CircleStatus.CANCELLED].includes(circle.status)
    )
      throw new ConflictException('Circle cannot be cancelled');
    if (Number(circle.amountRaised) > 0)
      throw new ConflictException(
        'A funded circle must be refunded by an administrator before cancellation',
      );
    circle.status = CircleStatus.CANCELLED;
    await this.circles.save(circle);
    await this.addActivity(
      this.circles.manager,
      id,
      CircleActivityType.CIRCLE_CANCELLED,
      'Circle cancelled',
    );
    return { message: 'Circle cancelled' };
  }

  async remove(id: string, user: AuthUser) {
    const circle = await this.owned(id, user);
    if (circle.status !== CircleStatus.DRAFT)
      throw new ConflictException('Only draft circles can be deleted');
    await this.circles.remove(circle);
    return { message: 'Draft circle deleted' };
  }

  async addItem(circleId: string, user: AuthUser, dto: CreateGiftItemDto) {
    const circle = await this.owned(circleId, user);
    this.assertCircleEditable(circle);
    const item = await this.items.save(
      this.createItemEntity(circleId, dto, this.items.manager),
    );
    const response = this.circleItem(item);
    this.socket.emitCircleUpdated(circleId, {
      action: 'item:created',
      item: response,
    });
    return response;
  }

  async updateItem(
    circleId: string,
    itemId: string,
    user: AuthUser,
    dto: UpdateGiftItemDto,
  ) {
    const circle = await this.owned(circleId, user);
    this.assertCircleEditable(circle, true);
    const item = await this.items.findOne({ where: { id: itemId, circleId } });
    if (!item) throw new NotFoundException('Gift item not found');
    if (
      dto.targetAmount !== undefined &&
      dto.targetAmount < Number(item.fundedAmount)
    ) {
      throw new BadRequestException(
        'Item target cannot be lower than its funded amount',
      );
    }
    Object.assign(item, dto, {
      targetAmount:
        dto.targetAmount === undefined
          ? item.targetAmount
          : this.money(dto.targetAmount),
    });
    const saved = await this.items.save(item);
    const response = this.circleItem(saved);
    this.socket.emitCircleUpdated(circleId, {
      action: 'item:updated',
      item: response,
    });
    return response;
  }

  async removeItem(circleId: string, itemId: string, user: AuthUser) {
    const circle = await this.owned(circleId, user);
    this.assertCircleEditable(circle);
    const item = await this.items.findOne({ where: { id: itemId, circleId } });
    if (!item) throw new NotFoundException('Gift item not found');
    if (Number(item.fundedAmount) > 0)
      throw new ConflictException('A funded item cannot be deleted');
    await this.items.remove(item);
    this.socket.emitCircleUpdated(circleId, { action: 'item:deleted', itemId });
    return { message: 'Gift item deleted' };
  }

  async createInvitations(
    circleId: string,
    user: AuthUser,
    dto: CreateInvitationsDto,
  ) {
    const circle = await this.owned(circleId, user);
    if (
      circle.status === CircleStatus.CANCELLED ||
      circle.status === CircleStatus.COMPLETED
    ) {
      throw new ConflictException('Invitations are closed for this circle');
    }
    const result: Invitation[] = [];
    for (const recipient of dto.recipients) {
      const email = recipient.email?.toLowerCase() ?? null;
      const duplicate = await this.invitations.findOne({
        where: email
          ? { circleId, email }
          : { circleId, phone: recipient.phone },
      });
      if (duplicate && duplicate.expiresAt > new Date()) {
        result.push(duplicate);
        continue;
      }
      result.push(
        await this.invitations.save(
          this.invitations.create({
            circleId,
            email,
            phone: recipient.phone ?? null,
            code: randomBytes(24).toString('hex'),
            expiresAt: circle.deadline,
          }),
        ),
      );
      const created = result[result.length - 1];
      const invitedUser = await this.circles.manager
        .getRepository(User)
        .findOne({
          where: email ? { email } : { phone: recipient.phone! },
        });
      if (invitedUser) {
        await this.notifications.create(
          invitedUser.id,
          NotificationType.INVITATION,
          `You're invited to ${circle.title}`,
          'An organizer invited you to join a GiftCircle.',
          { circleId, invitationCode: created?.code },
        );
      }
    }
    return result.map((invite) => ({
      ...invite,
      invitationUrl: `${this.shareUrl(circle.slug)}?invitationCode=${invite.code}`,
    }));
  }

  async listInvitations(circleId: string, user: AuthUser) {
    await this.owned(circleId, user);
    return this.invitations.find({
      where: { circleId },
      order: { createdAt: 'DESC' },
    });
  }

  async invitationDetails(code: string) {
    const invitation = await this.invitations.findOne({
      where: { code },
      relations: { circle: true },
    });
    if (!invitation || invitation.expiresAt <= new Date())
      throw new NotFoundException('Invitation is invalid or expired');
    return {
      code: invitation.code,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      circle: this.publicCircle(invitation.circle),
    };
  }

  async acceptInvitation(code: string, user: AuthUser) {
    const invitation = await this.invitations.findOne({
      where: { code },
      relations: { circle: true },
    });
    if (!invitation || invitation.expiresAt <= new Date())
      throw new NotFoundException('Invitation is invalid or expired');
    if (
      invitation.email &&
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new ForbiddenException(
        'This invitation was sent to another email address',
      );
    }
    if (invitation.phone && invitation.phone !== user.phone) {
      throw new ForbiddenException(
        'This invitation was sent to another phone number',
      );
    }
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedById = user.id;
    invitation.acceptedAt = new Date();
    await this.invitations.save(invitation);
    return {
      message: 'Invitation accepted',
      circleId: invitation.circleId,
      slug: invitation.circle.slug,
    };
  }

  async createUpdate(
    circleId: string,
    user: AuthUser,
    dto: CreateCircleUpdateDto,
  ) {
    const circle = await this.owned(circleId, user);
    if (circle.status === CircleStatus.CANCELLED)
      throw new ConflictException('Circle is cancelled');
    const update = await this.updates.save(
      this.updates.create({
        circleId,
        authorId: user.id,
        ...dto,
        imageUrl: dto.imageUrl ?? null,
      }),
    );
    await this.addActivity(
      this.circles.manager,
      circleId,
      CircleActivityType.UPDATE_POSTED,
      dto.title,
    );
    await this.notifyContributors(circleId, dto.title, dto.message);
    this.socket.emitCircleUpdated(circleId, {
      action: 'update:created',
      update,
    });
    return update;
  }

  async updatePost(
    circleId: string,
    updateId: string,
    user: AuthUser,
    dto: UpdateCircleUpdateDto,
  ) {
    await this.owned(circleId, user);
    const post = await this.updates.findOne({
      where: { id: updateId, circleId },
    });
    if (!post) throw new NotFoundException('Update not found');
    Object.assign(post, dto);
    const saved = await this.updates.save(post);
    this.socket.emitCircleUpdated(circleId, {
      action: 'update:updated',
      update: saved,
    });
    return saved;
  }

  async removePost(circleId: string, updateId: string, user: AuthUser) {
    await this.owned(circleId, user);
    const result = await this.updates.delete({ id: updateId, circleId });
    if (!result.affected) throw new NotFoundException('Update not found');
    this.socket.emitCircleUpdated(circleId, {
      action: 'update:deleted',
      updateId,
    });
    return { message: 'Update deleted' };
  }

  async updateFulfillment(
    circleId: string,
    user: AuthUser,
    dto: UpdateFulfillmentDto,
  ) {
    const circle = await this.owned(circleId, user);
    if (dto.status === FulfillmentStatus.CONFIRMED) {
      throw new ForbiddenException(
        'Only the recipient can confirm receipt of a delivery',
      );
    }
    if (Number(circle.amountRaised) <= 0)
      throw new ConflictException(
        'Fulfillment cannot begin before a contribution is received',
      );
    const fulfillment = await this.fulfillments.findOne({
      where: { circleId },
    });
    if (!fulfillment)
      throw new NotFoundException('Fulfillment record not found');
    const order = Object.values(FulfillmentStatus);
    if (order.indexOf(dto.status) < order.indexOf(fulfillment.status)) {
      throw new ConflictException('Fulfillment status cannot move backwards');
    }
    Object.assign(fulfillment, dto);
    const now = new Date();
    if (
      dto.status === FulfillmentStatus.IN_TRANSIT &&
      !fulfillment.dispatchedAt
    )
      fulfillment.dispatchedAt = now;
    if (dto.status === FulfillmentStatus.DELIVERED && !fulfillment.deliveredAt)
      fulfillment.deliveredAt = now;
    if (
      ![FulfillmentStatus.PENDING, FulfillmentStatus.CONFIRMED].includes(
        dto.status,
      )
    )
      circle.status = CircleStatus.FULFILLING;
    await this.circles.save(circle);
    const saved = await this.fulfillments.save(fulfillment);
    await this.addActivity(
      this.circles.manager,
      circleId,
      dto.status === FulfillmentStatus.DELIVERED
        ? CircleActivityType.GIFT_DELIVERED
        : CircleActivityType.FULFILLMENT_UPDATED,
      `Fulfillment status changed to ${dto.status}`,
      { status: dto.status, trackingNumber: saved.trackingNumber },
    );
    await this.notifyContributors(
      circleId,
      'Gift fulfillment update',
      `The fulfillment status is now ${dto.status}.`,
      NotificationType.FULFILLMENT_UPDATE,
    );
    this.socket.emitFulfillmentUpdated(circleId, saved);
    return saved;
  }

  async regenerateConfirmationLink(circleId: string, user: AuthUser) {
    const circle = await this.owned(circleId, user);
    const token = randomBytes(32).toString('hex');
    await this.circles
      .createQueryBuilder()
      .update()
      .set({ recipientTokenHash: this.hash(token) })
      .where('id = :circleId', { circleId })
      .execute();
    return { recipientConfirmationUrl: this.confirmationUrl(circle.id, token) };
  }

  async confirmReceipt(circleId: string, token: string) {
    const circle = await this.circles
      .createQueryBuilder('circle')
      .addSelect('circle.recipientTokenHash')
      .where('circle.id = :circleId', { circleId })
      .getOne();
    if (
      !circle ||
      !circle.recipientTokenHash ||
      this.hash(token) !== circle.recipientTokenHash
    ) {
      throw new ForbiddenException('Invalid recipient confirmation token');
    }
    const fulfillment = await this.fulfillments.findOne({
      where: { circleId },
    });
    if (!fulfillment || fulfillment.status !== FulfillmentStatus.DELIVERED) {
      throw new ConflictException(
        'The delivery must be marked delivered before receipt can be confirmed',
      );
    }
    const now = new Date();
    fulfillment.status = FulfillmentStatus.CONFIRMED;
    fulfillment.confirmedAt = now;
    circle.status = CircleStatus.COMPLETED;
    circle.completedAt = now;
    circle.recipientTokenHash = null;
    await this.circles.manager.transaction(async (manager) => {
      await manager.save(circle);
      await manager.save(fulfillment);
      await this.addActivity(
        manager,
        circleId,
        CircleActivityType.RECEIPT_CONFIRMED,
        'Recipient confirmed receipt',
      );
    });
    await this.notifyContributors(
      circleId,
      'Gift received',
      `${circle.recipientName} confirmed receipt of the GiftCircle.`,
      NotificationType.DELIVERY,
    );
    this.socket.emitFulfillmentUpdated(circleId, fulfillment);
    return { message: 'Receipt confirmed. The circle is complete.' };
  }

  async dashboard(circleId: string, user: AuthUser) {
    const circle = await this.owned(circleId, user);
    const stats = await this.contributions
      .createQueryBuilder('contribution')
      .select('COUNT(*)', 'contributions')
      .addSelect(
        'COUNT(DISTINCT COALESCE(contribution.contributor_id::text, contribution.guest_email, contribution.id::text))',
        'participants',
      )
      .addSelect('COALESCE(SUM(contribution.amount), 0)', 'raised')
      .addSelect('COALESCE(AVG(contribution.amount), 0)', 'average')
      .where('contribution.circle_id = :circleId', { circleId })
      .andWhere('contribution.status = :status', {
        status: ContributionStatus.SUCCESS,
      })
      .getRawOne<{
        contributions: string;
        participants: string;
        raised: string;
        average: string;
      }>();
    const recent = await this.contributions.find({
      where: { circleId, status: ContributionStatus.SUCCESS },
      relations: { contributor: true, giftItem: true },
      order: { paidAt: 'DESC' },
      take: 50,
    });
    return {
      circle: this.withProgress(circle),
      stats: {
        contributions: Number(stats?.contributions ?? 0),
        participants: Number(stats?.participants ?? 0),
        raised: Number(stats?.raised ?? 0),
        averageContribution: Number(stats?.average ?? 0),
      },
      recentContributions: recent.map((entry) =>
        this.organizerContribution(entry),
      ),
    };
  }

  private async owned(id: string, user: AuthUser) {
    const circle = await this.circles.findOne({
      where: { id },
      relations: { items: true, fulfillment: true },
    });
    if (!circle) throw new NotFoundException('Circle not found');
    if (circle.organizerId !== user.id && user.role !== UserRole.ADMIN)
      throw new ForbiddenException(
        'Only the organizer can perform this action',
      );
    return circle;
  }

  private assertCircleEditable(circle: Circle, allowFulfilling = false) {
    const editable: CircleStatus[] = [
      CircleStatus.DRAFT,
      CircleStatus.ACTIVE,
      CircleStatus.FUNDED,
    ];
    if (allowFulfilling) editable.push(CircleStatus.FULFILLING);
    if (!editable.includes(circle.status))
      throw new ConflictException('Circle can no longer be edited');
  }

  private assertFutureDeadline(deadline: Date) {
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date())
      throw new BadRequestException('Deadline must be in the future');
  }

  private createItemEntity(
    circleId: string,
    dto: CreateGiftItemDto,
    manager: EntityManager,
  ) {
    return manager.create(GiftItem, {
      circleId,
      name: dto.name,
      description: dto.description ?? null,
      quantity: dto.quantity ?? 1,
      targetAmount: this.money(dto.targetAmount),
      fundedAmount: '0.00',
      productUrl: dto.productUrl ?? null,
    });
  }

  private async uniqueSlug(title: string, manager: EntityManager) {
    const base =
      title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 100) || 'gift-circle';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = `${base}-${randomBytes(4).toString('hex')}`;
      if (!(await manager.exists(Circle, { where: { slug } }))) return slug;
    }
    throw new ConflictException('Could not generate a unique circle link');
  }

  private async hasPrivateAccess(
    circleId: string,
    code?: string,
    user?: AuthUser | null,
  ) {
    if (user) {
      const circle = await this.circles.findOne({ where: { id: circleId } });
      if (circle?.organizerId === user.id || user.role === UserRole.ADMIN)
        return true;
      if (
        await this.contributions.exists({
          where: {
            circleId,
            contributorId: user.id,
            status: ContributionStatus.SUCCESS,
          },
        })
      )
        return true;
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
    const invite = await this.invitations
      .createQueryBuilder('invitation')
      .where('invitation.circleId = :circleId', { circleId })
      .andWhere(
        '(invitation.code = :code OR invitation.tokenHash = :tokenHash)',
        { code, tokenHash: this.hash(code) },
      )
      .getOne();
    return (
      !!invite &&
      invite.expiresAt > new Date() &&
      ![InvitationStatus.DECLINED, InvitationStatus.EXPIRED].includes(
        invite.status,
      )
    );
  }

  private publicCircle(circle: Circle, includeSocial = false) {
    const successful = (circle.contributions ?? []).filter(
      (entry) => entry.status === ContributionStatus.SUCCESS,
    );
    const participants = new Set(
      successful.map(
        (entry) => entry.contributorId ?? entry.guestEmail ?? entry.id,
      ),
    ).size;
    const result: Record<string, unknown> = {
      id: circle.id,
      slug: circle.slug,
      title: circle.title,
      occasion: circle.occasion,
      story: circle.story,
      recipientName: circle.recipientName,
      coverImageUrl: circle.coverImageUrl,
      privacy: circle.privacy,
      status: circle.status,
      targetAmount: Number(circle.targetAmount),
      amountRaised: Number(circle.amountRaised),
      currency: circle.currency,
      deadline: circle.deadline,
      allowGeneralContributions: circle.allowGeneralContributions,
      organizer: circle.organizer
        ? {
            id: circle.organizer.id,
            name: circle.organizer.name,
            avatarUrl: circle.organizer.avatarUrl,
          }
        : undefined,
      items: (circle.items ?? []).map((item) => ({
        ...this.circleItem(item),
        targetAmount: Number(item.targetAmount),
        fundedAmount: Number(item.fundedAmount),
        progress: this.progress(item.fundedAmount, item.targetAmount),
      })),
      participants,
      progress: this.progress(circle.amountRaised, circle.targetAmount),
      shareUrl: this.shareUrl(circle.slug),
      publishedAt: circle.publishedAt,
      createdAt: circle.createdAt,
    };
    if (includeSocial) {
      result.contributions = successful
        .slice(0, 100)
        .map((entry) => this.publicContribution(entry));
      result.updates = (circle.updates ?? []).slice(0, 100).map((update) => ({
        id: update.id,
        title: update.title,
        message: update.message,
        imageUrl: update.imageUrl,
        author: update.author
          ? {
              id: update.author.id,
              name: update.author.name,
              avatarUrl: update.author.avatarUrl,
            }
          : undefined,
        createdAt: update.createdAt,
      }));
      result.activity = (circle.activities ?? []).slice(0, 100);
      result.fulfillment = circle.fulfillment
        ? {
            status: circle.fulfillment.status,
            courierName: circle.fulfillment.courierName,
            trackingNumber: circle.fulfillment.trackingNumber,
            trackingUrl: circle.fulfillment.trackingUrl,
            proofUrl: circle.fulfillment.proofUrl,
            dispatchedAt: circle.fulfillment.dispatchedAt,
            deliveredAt: circle.fulfillment.deliveredAt,
            confirmedAt: circle.fulfillment.confirmedAt,
          }
        : null;
    }
    return result;
  }

  private publicContribution(entry: Contribution) {
    const name =
      entry.contributor?.name ?? entry.guestName ?? 'GiftCircle member';
    return {
      id: entry.id,
      contributorName: entry.showName ? name : 'Anonymous',
      contributorAvatarUrl: entry.showName
        ? entry.contributor?.avatarUrl
        : null,
      amount: entry.showAmount ? Number(entry.amount) : null,
      message: entry.showMessage ? entry.message : null,
      giftItem: entry.giftItem
        ? { id: entry.giftItem.id, name: entry.giftItem.name }
        : null,
      paidAt: entry.paidAt,
    };
  }

  private organizerContribution(entry: Contribution) {
    return {
      id: entry.id,
      name: entry.contributor?.name ?? entry.guestName ?? 'Guest',
      email: entry.contributor?.email ?? entry.guestEmail,
      amount: Number(entry.amount),
      message: entry.message,
      giftItem: entry.giftItem
        ? { id: entry.giftItem.id, name: entry.giftItem.name }
        : null,
      paidAt: entry.paidAt,
      paymentReference: entry.paymentReference,
    };
  }

  private withProgress(circle: Circle) {
    const { items, ...data } = circle;
    const response: Record<string, unknown> = { ...data };
    delete response.coverAssetId;
    delete response.recipientTokenHash;
    return {
      ...response,
      items: items?.map((item) => this.circleItem(item)),
      targetAmount: Number(circle.targetAmount),
      amountRaised: Number(circle.amountRaised),
      progress: this.progress(circle.amountRaised, circle.targetAmount),
    };
  }

  private circleData(circle: Circle) {
    const data: Record<string, unknown> = { ...circle };
    delete data.coverAssetId;
    delete data.recipientTokenHash;
    return data;
  }

  private circleItem(item: GiftItem) {
    return {
      id: item.id,
      circleId: item.circleId,
      clientReference: item.clientReference,
      emoji: item.emoji,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      targetAmount: item.targetAmount,
      fundedAmount: item.fundedAmount,
      productUrl: item.productUrl,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private progress(current: string, target: string) {
    return Number(target) <= 0
      ? 0
      : Math.min(
          100,
          Math.round((Number(current) / Number(target)) * 10000) / 100,
        );
  }

  private clientDraftSummary(
    circle: Circle,
    subtotalKobo: number,
    flexBufferKobo: number,
    goalKobo: number,
  ) {
    return {
      id: circle.id,
      slug: circle.slug,
      status: this.clientStatus(circle.status),
      version: circle.version,
      currency: circle.currency,
      subtotalKobo,
      flexBufferKobo,
      goalKobo,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
    };
  }

  private clientExploreCircle(circle: Circle) {
    const meta = this.occasionMeta(circle.occasion);
    return {
      id: circle.id,
      slug: circle.slug,
      title: circle.title,
      occasion: meta.slug,
      city: circle.recipientCity ?? circle.deliveryAddress?.city ?? null,
      countryCode: circle.recipientCountryCode ?? 'NG',
      organizer: {
        displayName: circle.organizer?.name ?? 'GiftCircle Organizer',
        verified: Boolean(circle.organizer && !circle.organizer.isSuspended),
      },
      cover: {
        url: circle.coverImageUrl,
        alt: circle.coverAlt ?? circle.title,
      },
      wishlistPreview: (circle.items ?? []).slice(0, 3).map((item) => ({
        id: item.id,
        name: item.name,
        emoji: item.emoji,
      })),
      funding: {
        currency: circle.currency,
        goalKobo: this.toKobo(circle.targetAmount),
        raisedKobo: this.toKobo(circle.amountRaised),
        percent: Math.round(
          this.progress(circle.amountRaised, circle.targetAmount),
        ),
        supporterCount: circle.supporterCount ?? 0,
        closesAt: circle.deadline,
      },
      status: this.clientStatus(circle.status),
      shareUrl: this.shareUrl(circle.slug),
    };
  }

  private clientCircleDetail(circle: Circle, canManage: boolean) {
    const now = new Date();
    return {
      id: circle.id,
      slug: circle.slug,
      status: this.clientStatus(circle.status),
      privacy: this.clientPrivacy(circle.privacy),
      occasion: this.occasionMeta(circle.occasion).slug,
      title: circle.title,
      storyMarkdown: circle.story,
      recipient: {
        displayName: circle.recipientName,
        city: circle.recipientCity ?? circle.deliveryAddress?.city ?? null,
        countryCode: circle.recipientCountryCode ?? 'NG',
      },
      organizer: {
        id: circle.organizer.id,
        displayName: circle.organizer.name,
        verified: !circle.organizer.isSuspended,
      },
      cover: {
        url: circle.coverImageUrl,
        alt: circle.coverAlt ?? circle.title,
      },
      funding: {
        currency: circle.currency,
        goalKobo: this.toKobo(circle.targetAmount),
        raisedKobo: this.toKobo(circle.amountRaised),
        percent: Math.round(
          this.progress(circle.amountRaised, circle.targetAmount),
        ),
        supporterCount: circle.supporterCount ?? 0,
        closesAt: circle.deadline,
        acceptsContributions:
          circle.status === CircleStatus.ACTIVE && circle.deadline > now,
      },
      wishlist: (circle.items ?? []).map((item) => {
        const target = this.toKobo(item.targetAmount);
        const funded = this.toKobo(item.fundedAmount);
        const remaining = Math.max(0, target - funded);
        return {
          id: item.id,
          emoji: item.emoji,
          name: item.name,
          description: item.description,
          targetAmountKobo: target,
          fundedAmountKobo: funded,
          remainingAmountKobo: remaining,
          status:
            remaining === 0
              ? 'funded'
              : funded > 0
                ? 'partially_funded'
                : 'open',
          suggestedContributionKobo: remaining,
        };
      }),
      fulfillment: {
        stage: this.fulfillmentStage(circle.fulfillment),
        publicLabel: this.fulfillmentLabel(circle.fulfillment),
      },
      viewer: {
        canView: true,
        canContribute:
          circle.status === CircleStatus.ACTIVE && circle.deadline > now,
        canManage,
      },
      updatedAt: circle.updatedAt,
    };
  }

  private clientPublishedSummary(circle: Circle) {
    return {
      id: circle.id,
      slug: circle.slug,
      status: this.clientStatus(circle.status),
      publishedAt: circle.publishedAt,
      shareUrl: this.shareUrl(circle.slug),
      organizerUrl: `${this.config.frontendUrl || 'http://localhost:3000'}/organizer/circles/${circle.id}`,
    };
  }

  private assertClientPublishable(circle: Circle) {
    const errors: string[] = [];
    if (!circle.title?.trim()) errors.push('title');
    if (!circle.recipientName?.trim()) errors.push('recipient');
    if (!circle.coverImageUrl) errors.push('cover image');
    if (Number(circle.targetAmount) <= 0) errors.push('funding goal');
    if (
      circle.fundingMode === 'itemized' &&
      (!circle.items?.length ||
        circle.items.some((item) => Number(item.targetAmount) <= 0))
    ) {
      errors.push('wishlist targets');
    }
    if (
      circle.deliveryCollectionMode === 'provide_now' &&
      !circle.deliveryAddress &&
      !['saved', 'confirmed'].includes(
        circle.fulfillment?.addressStatus ?? 'pending',
      )
    ) {
      errors.push('delivery address');
    }
    if (errors.length) {
      throw new UnprocessableEntityException({
        code: 'CIRCLE_NOT_PUBLISHABLE',
        message: `Invalid or missing: ${errors.join(', ')}`,
        fields: errors,
      });
    }
  }

  private toOccasion(value: CircleOccasion | string) {
    const normalized = value.toString().trim().toLowerCase().replace(/_/g, '-');
    const aliases: Record<string, CircleOccasion> = {
      birthday: CircleOccasion.BIRTHDAY,
      wedding: CircleOccasion.WEDDING,
      weddings: CircleOccasion.WEDDING,
      'new-baby': CircleOccasion.NEW_BABY,
      graduation: CircleOccasion.GRADUATION,
      education: CircleOccasion.GRADUATION,
      bereavement: CircleOccasion.BEREAVEMENT,
      recovery: CircleOccasion.RECOVERY,
      health: CircleOccasion.RECOVERY,
      housewarming: CircleOccasion.HOUSEWARMING,
      'community-support': CircleOccasion.COMMUNITY_SUPPORT,
      emergency: CircleOccasion.EMERGENCY_ASSISTANCE,
      'emergency-assistance': CircleOccasion.EMERGENCY_ASSISTANCE,
      other: CircleOccasion.OTHER,
    };
    const occasion = aliases[normalized];
    if (!occasion) throw new BadRequestException('Unsupported occasion');
    return occasion;
  }

  private toPrivacy(value?: CirclePrivacy | string) {
    if (!value) return CirclePrivacy.LINK_ONLY;
    const values: Record<string, CirclePrivacy> = {
      [CirclePrivacy.PRIVATE]: CirclePrivacy.PRIVATE,
      [CirclePrivacy.LINK_ONLY]: CirclePrivacy.LINK_ONLY,
      [CirclePrivacy.COMMUNITY]: CirclePrivacy.COMMUNITY,
      invite: CirclePrivacy.PRIVATE,
      link: CirclePrivacy.LINK_ONLY,
      public: CirclePrivacy.COMMUNITY,
    };
    return values[value] ?? CirclePrivacy.LINK_ONLY;
  }

  private clientPrivacy(value: CirclePrivacy) {
    return value === CirclePrivacy.PRIVATE
      ? 'invite'
      : value === CirclePrivacy.COMMUNITY
        ? 'public'
        : 'link';
  }

  private clientStatus(value: CircleStatus) {
    const values: Record<CircleStatus, string> = {
      [CircleStatus.DRAFT]: 'draft',
      [CircleStatus.ACTIVE]: 'published',
      [CircleStatus.FUNDED]: 'funded',
      [CircleStatus.FULFILLING]: 'fulfilling',
      [CircleStatus.COMPLETED]: 'completed',
      [CircleStatus.CANCELLED]: 'cancelled',
      [CircleStatus.EXPIRED]: 'expired',
    };
    return values[value];
  }

  private occasionMeta(value: CircleOccasion) {
    const values: Record<
      CircleOccasion,
      { slug: string; label: string; emoji: string }
    > = {
      [CircleOccasion.BIRTHDAY]: {
        slug: 'birthday',
        label: 'Celebrations',
        emoji: '🎉',
      },
      [CircleOccasion.WEDDING]: {
        slug: 'wedding',
        label: 'Weddings',
        emoji: '💍',
      },
      [CircleOccasion.NEW_BABY]: {
        slug: 'new-baby',
        label: 'New Baby',
        emoji: '🍼',
      },
      [CircleOccasion.GRADUATION]: {
        slug: 'graduation',
        label: 'Education',
        emoji: '🎓',
      },
      [CircleOccasion.BEREAVEMENT]: {
        slug: 'bereavement',
        label: 'Bereavement',
        emoji: '🕊️',
      },
      [CircleOccasion.RECOVERY]: {
        slug: 'health',
        label: 'Health',
        emoji: '💚',
      },
      [CircleOccasion.HOUSEWARMING]: {
        slug: 'housewarming',
        label: 'Celebrations',
        emoji: '🏠',
      },
      [CircleOccasion.COMMUNITY_SUPPORT]: {
        slug: 'community-support',
        label: 'Celebrations',
        emoji: '🤝',
      },
      [CircleOccasion.EMERGENCY_ASSISTANCE]: {
        slug: 'emergency',
        label: 'Emergency',
        emoji: '🆘',
      },
      [CircleOccasion.OTHER]: { slug: 'other', label: 'Other', emoji: '🎁' },
    };
    return values[value] ?? values[CircleOccasion.OTHER];
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

  private fulfillmentLabel(fulfillment?: Fulfillment | null) {
    const stage = this.fulfillmentStage(fulfillment);
    return stage === 'funding'
      ? 'Target Funding'
      : stage === 'purchasing'
        ? 'Gift Preparation'
        : stage === 'delivery'
          ? 'Delivery'
          : 'Completed';
  }

  private parseVersion(value?: string) {
    if (!value) return null;
    const parsed = Number(value.replace(/^W\//, '').replaceAll('"', '').trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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
      return typeof value.offset === 'number' && value.offset >= 0
        ? Math.floor(value.offset)
        : 0;
    } catch {
      throw new BadRequestException('Invalid pagination cursor');
    }
  }

  private async addActivity(
    manager: EntityManager,
    circleId: string,
    type: CircleActivityType,
    description: string,
    metadata: Record<string, unknown> | null = null,
  ) {
    await manager.save(
      manager.create(CircleActivity, { circleId, type, description, metadata }),
    );
  }

  private async notifyContributors(
    circleId: string,
    title: string,
    message: string,
    type = NotificationType.CIRCLE_UPDATE,
  ) {
    const rows = await this.contributions
      .createQueryBuilder('contribution')
      .select('DISTINCT contribution.contributor_id', 'userId')
      .where('contribution.circle_id = :circleId', { circleId })
      .andWhere('contribution.status = :status', {
        status: ContributionStatus.SUCCESS,
      })
      .andWhere('contribution.contributor_id IS NOT NULL')
      .getRawMany<{ userId: string }>();
    await this.notifications.createMany(
      rows.map(({ userId }) => userId),
      type,
      title,
      message,
      { circleId },
    );
  }

  private money(value: number) {
    return value.toFixed(2);
  }
  private fromKobo(value: number) {
    return (value / 100).toFixed(2);
  }
  private toKobo(value: string | number) {
    return Math.round(Number(value) * 100);
  }
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  private encryptAddress(value: object) {
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
  private shareUrl(slug: string) {
    return `${this.config.frontendUrl || 'http://localhost:3000'}/circles/${slug}`;
  }
  private confirmationUrl(circleId: string, token: string) {
    return `${this.config.frontendUrl || 'http://localhost:3000'}/circles/${circleId}/confirm-receipt?token=${token}`;
  }
  private paginated<T>(data: T[], total: number, page: number, limit: number) {
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
