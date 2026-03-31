import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    try {
      return await this.prisma.category.create({ data: { ...dto, userId } });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystem: true }],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { isSystem: true }],
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
    if (existing.isSystem) {
      throw new BadRequestException('System categories cannot be modified');
    }
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);
    if (existing.isSystem) {
      throw new BadRequestException('System categories cannot be deleted');
    }
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete category with existing transactions. Reassign or delete them first.',
        );
      }
      throw error;
    }
  }
}
