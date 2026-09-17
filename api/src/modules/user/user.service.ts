import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Token } from '../../database/entities/Token';
import { User } from '../../database/entities/User';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async profile(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.safe(user);
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.users.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto, {
      currency: dto.currency?.toUpperCase() ?? user.currency,
    });
    return this.safe(await this.users.save(user));
  }

  async delete(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.users.manager.transaction(async (manager) => {
      await manager.delete(Token, { userId });
      user.deletedAt = new Date();
      user.name = 'Deleted user';
      user.email = `deleted-${user.id}@giftcircle.invalid`;
      user.passwordHash = null;
      user.googleId = null;
      user.avatarUrl = null;
      user.phone = null;
      await manager.save(user);
    });
    return { message: 'Account deleted successfully' };
  }

  async adminList(page = 1, limit = 20, search?: string) {
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const where = search
      ? [
          { name: ILike(`%${search}%`), deletedAt: IsNull() },
          { email: ILike(`%${search}%`), deletedAt: IsNull() },
        ]
      : { deletedAt: IsNull() };
    const [data, total] = await this.users.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((user) => this.safe(user)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private safe(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      country: user.country,
      currency: user.currency,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
