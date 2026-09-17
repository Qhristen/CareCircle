import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/enums';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiContract({
    summary: 'List active categories',
    description:
      'Returns active standalone categories. Categories are maintained independently and are not required by the circle flow.',
    response: {
      status: 200,
      description: 'The active category collection.',
      schema: { type: 'array', items: { type: 'object' } },
    },
  })
  list() {
    return this.service.findAll(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'List all categories',
    description:
      'Returns active and inactive standalone categories for an administrator.',
    response: {
      status: 200,
      description: 'The complete category collection.',
      schema: { type: 'array', items: { type: 'object' } },
    },
  })
  adminList() {
    return this.service.findAll(false);
  }

  @Get(':idOrSlug')
  @ApiContract({
    summary: 'Get a category',
    description: 'Returns one standalone category by its UUID or slug.',
    responseDescription: 'The requested category.',
  })
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findOne(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Create a category',
    description:
      'Creates a standalone category. The optional icon is a client-uploaded string reference.',
    status: 201,
    responseDescription: 'The newly created category.',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Update a category',
    description:
      'Updates the supplied fields on a standalone category without affecting circles.',
    responseDescription: 'The updated category.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiContract({
    summary: 'Delete a category',
    description:
      'Deletes an unused standalone category; categories referenced by retained historical data cannot be removed.',
    responseDescription: 'A category deletion confirmation.',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
