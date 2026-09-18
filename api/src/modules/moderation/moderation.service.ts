import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleUpdate } from '../../database/entities/CircleUpdate';
import { Contribution } from '../../database/entities/Contribution';
import { ModerationReport } from '../../database/entities/ModerationReport';
import { Token } from '../../database/entities/Token';
import { User } from '../../database/entities/User';
import {
  ModerationStatus,
  ModerationTargetType,
  NotificationType,
} from '../../database/enums';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../socket/socket.gateway';
import {
  CreateModerationReportDto,
  ModerationListQueryDto,
  ReviewModerationReportDto,
} from './dto/moderation.dto';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(ModerationReport)
    private readonly reports: Repository<ModerationReport>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Circle) private readonly circles: Repository<Circle>,
    @InjectRepository(CircleUpdate)
    private readonly updates: Repository<CircleUpdate>,
    @InjectRepository(Contribution)
    private readonly contributions: Repository<Contribution>,
    private readonly notifications: NotificationService,
    private readonly socket: SocketGateway,
  ) {}

  async report(reporterId: string, dto: CreateModerationReportDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);
    const duplicate = await this.reports.exists({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: ModerationStatus.OPEN,
      },
    });
    if (duplicate)
      throw new ConflictException(
        'You already have an open report for this content',
      );
    return this.reports.save(
      this.reports.create({
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details ?? null,
        reviewedById: null,
        resolutionNote: null,
        resolvedAt: null,
      }),
    );
  }

  async list(query: ModerationListQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;
    const [data, total] = await this.reports.findAndCount({
      where,
      relations: { reporter: true, reviewedBy: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async review(id: string, reviewerId: string, dto: ReviewModerationReportDto) {
    if (dto.status === ModerationStatus.OPEN)
      throw new BadRequestException('Use a review status');
    const report = await this.reports.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Moderation report not found');
    report.status = dto.status;
    report.reviewedById = reviewerId;
    report.resolutionNote = dto.resolutionNote ?? report.resolutionNote;
    report.resolvedAt = [
      ModerationStatus.RESOLVED,
      ModerationStatus.DISMISSED,
    ].includes(dto.status)
      ? new Date()
      : null;
    return this.reports.save(report);
  }

  async suspendUser(id: string, adminId: string) {
    if (id === adminId)
      throw new ForbiddenException('You cannot suspend your own account');
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.users.manager.transaction(async (manager) => {
      user.isSuspended = true;
      await manager.save(user);
      await manager.delete(Token, { userId: id });
    });
    return { message: 'User suspended' };
  }

  async unsuspendUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isSuspended = false;
    await this.users.save(user);
    await this.notifications.create(
      id,
      NotificationType.SYSTEM,
      'Account restored',
      'Your CareCircle account has been restored.',
    );
    return { message: 'User suspension removed' };
  }

  async setCircleVisibility(id: string, hidden: boolean, note?: string) {
    const circle = await this.circles.findOne({ where: { id } });
    if (!circle) throw new NotFoundException('Circle not found');
    circle.isHidden = hidden;
    await this.circles.save(circle);
    await this.notifications.create(
      circle.organizerId,
      NotificationType.SYSTEM,
      hidden ? 'Circle hidden by moderation' : 'Circle restored',
      note ||
        (hidden
          ? 'Your circle is temporarily unavailable while it is reviewed.'
          : 'Your circle is visible again.'),
      { circleId: id },
    );
    this.socket.emitCircleUpdated(id, {
      action: hidden ? 'moderation:hidden' : 'moderation:restored',
    });
    return { message: hidden ? 'Circle hidden' : 'Circle restored' };
  }

  private async assertTargetExists(type: ModerationTargetType, id: string) {
    let exists = false;
    if (type === ModerationTargetType.USER)
      exists = await this.users.exists({ where: { id } });
    if (type === ModerationTargetType.CIRCLE)
      exists = await this.circles.exists({ where: { id } });
    if (type === ModerationTargetType.CIRCLE_UPDATE)
      exists = await this.updates.exists({ where: { id } });
    if (type === ModerationTargetType.CONTRIBUTION)
      exists = await this.contributions.exists({ where: { id } });
    if (!exists) throw new NotFoundException('Reported content was not found');
  }
}
