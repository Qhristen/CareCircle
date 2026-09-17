import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from '../../database/entities/Notification';
import { NotificationType } from '../../database/enums';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly socket: SocketGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, unknown> | null = null,
  ) {
    const notification = await this.notifications.save(
      this.notifications.create({ userId, type, title, message, data }),
    );
    this.socket.emitNotification(userId, notification);
    return notification;
  }

  async createMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, unknown> | null = null,
  ) {
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return [];
    const saved = await this.notifications.save(
      uniqueIds.map((userId) =>
        this.notifications.create({ userId, type, title, message, data }),
      ),
    );
    saved.forEach((notification) =>
      this.socket.emitNotification(notification.userId, notification),
    );
    return saved;
  }

  async list(userId: string, page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const [data, total] = await this.notifications.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unread = await this.notifications.count({
      where: { userId, readAt: IsNull() },
    });
    return {
      data,
      meta: {
        total,
        unread,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notifications.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.readAt ??= new Date();
    return this.notifications.save(notification);
  }

  async markAllRead(userId: string) {
    await this.notifications.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }

  async remove(userId: string, id: string) {
    const result = await this.notifications.delete({ id, userId });
    if (!result.affected) throw new NotFoundException('Notification not found');
    return { message: 'Notification deleted' };
  }
}
