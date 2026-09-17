import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CatalogItem } from '../../database/entities/ClientOperations';
import { CatalogQueryDto, PolishWritingDto } from './dto/supporting.dto';

@Injectable()
export class SupportingService {
  constructor(
    @InjectRepository(CatalogItem)
    private readonly catalog: Repository<CatalogItem>,
  ) {}

  polish(dto: PolishWritingDto) {
    const text = dto.text.trim().replace(/\s+/g, ' ');
    const blocked = this.containsSensitiveRequest(text);
    if (blocked) {
      return {
        data: {
          polishedText: text,
          moderation: { allowed: false },
        },
      };
    }
    const ending = text.endsWith('.') ? '' : '.';
    const introductions: Record<string, string> = {
      warm: 'With love and gratitude, ',
      formal: 'We are pleased to share that ',
      joyful: 'We are delighted to celebrate that ',
      gentle: 'With care and compassion, ',
    };
    const first = text.charAt(0).toLowerCase() + text.slice(1);
    return {
      data: {
        polishedText: `${introductions[dto.tone] ?? ''}${first}${ending}`,
        moderation: { allowed: true },
      },
    };
  }

  async items(query: CatalogQueryDto) {
    const where: Record<string, unknown> = {
      currency: query.currency.toUpperCase(),
      merchantVerified: true,
      available: true,
    };
    if (query.q) where.name = ILike(`%${query.q}%`);
    if (query.city) where.city = ILike(query.city);
    const rows = await this.catalog.find({
      where,
      order: { name: 'ASC' },
      take: query.limit,
    });
    return {
      data: rows.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        merchant: {
          name: item.merchantName,
          verified: item.merchantVerified,
        },
        priceKobo: Math.round(Number(item.priceAmount) * 100),
        currency: item.currency,
        available: item.available,
        city: item.city,
        deliveryEstimate: item.deliveryEstimate,
        imageUrl: item.imageUrl,
        productUrl: item.productUrl,
      })),
      meta: { count: rows.length },
    };
  }

  private containsSensitiveRequest(text: string) {
    return /\b(?:password|pin|one[- ]time password|bank login)\b/i.test(text);
  }
}
