import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.categoriesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.categoriesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.categoriesService.remove(id, user.userId);
  }
}
