import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { CatalogQueryDto, PolishWritingDto } from './dto/supporting.dto';
import { SupportingService } from './supporting.service';

@ApiTags('writing')
@Controller('writing')
export class WritingController {
  constructor(private readonly service: SupportingService) {}

  @Post('polish')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiContract({
    summary: 'Polish a circle story',
    description:
      'Returns a locally polished version of a draft while preserving the requested voice and meaning.',
    responseDescription: 'The original and polished story text.',
  })
  polish(@Body() dto: PolishWritingDto) {
    return this.service.polish(dto);
  }
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: SupportingService) {}

  @Get('items')
  @ApiContract({
    summary: 'Search catalog items',
    description:
      'Returns matching verified marketplace suggestions for the supplied query and optional price filters.',
    responseDescription: 'Catalog items and search metadata.',
  })
  items(@Query() query: CatalogQueryDto) {
    return this.service.items(query);
  }
}
