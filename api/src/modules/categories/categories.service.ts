import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/Category';
import { GiftItem } from '../../database/entities/GiftItem';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(GiftItem) private readonly items: Repository<GiftItem>,
  ) {}

  findAll(activeOnly = true) {
    return this.categories.find({
      where: activeOnly ? { isActive: true } : {},
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const category = await this.categories.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
    });
    if (!category) throw new NotFoundException('Category not found');
    return {
      ...category,
      giftItemsCount: await this.items.count({
        where: { categoryId: category.id },
      }),
    };
  }

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const slug = await this.uniqueSlug(name);
    if (
      await this.categories
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name })
        .getExists()
    ) {
      throw new ConflictException('A category with this name already exists');
    }
    return this.categories.save(
      this.categories.create({
        name,
        slug,
        description: dto.description ?? null,
        iconUrl: dto.iconUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (
      dto.name &&
      dto.name.trim().toLowerCase() !== category.name.toLowerCase()
    ) {
      category.name = dto.name.trim();
      category.slug = await this.uniqueSlug(category.name, category.id);
    }
    Object.assign(category, {
      description: dto.description ?? category.description,
      iconUrl: dto.iconUrl ?? category.iconUrl,
      sortOrder: dto.sortOrder ?? category.sortOrder,
      isActive: dto.isActive ?? category.isActive,
    });
    return this.categories.save(category);
  }

  async remove(id: string) {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    const count = await this.items.count({ where: { categoryId: id } });
    if (count)
      throw new ConflictException(
        `Category is used by ${count} gift item(s); deactivate it instead`,
      );
    await this.categories.remove(category);
    return { message: 'Category deleted' };
  }

  private async uniqueSlug(name: string, excludingId?: string) {
    const base =
      name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 100) || 'category';
    let slug = base;
    let suffix = 2;
    while (
      await this.categories
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug })
        .andWhere(excludingId ? 'category.id != :excludingId' : '1=1', {
          excludingId,
        })
        .getExists()
    ) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }
}
