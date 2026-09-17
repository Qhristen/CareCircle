import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class XssValidationPipe implements PipeTransform<unknown, unknown> {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!['body', 'query', 'param'].includes(metadata.type)) return value;
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') return xss.filterXSS(value);
    if (Array.isArray(value))
      return value.map((item: unknown) => this.sanitize(item));
    if (value !== null && typeof value === 'object') {
      const clean: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(
        value as Record<string, unknown>,
      ))
        clean[key] = this.sanitize(child);
      return clean;
    }
    return value;
  }
}
