import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { USER_LIMITS } from '../common/constants/limits';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new user-owned category.
   * @throws BadRequestException when the user hits the category limit
   * @throws ConflictException on P2002 — duplicate name for this user (unique constraint)
   */
  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    const count = await this.prisma.category.count({ where: { userId } });
    if (count >= USER_LIMITS.categories) {
      throw new BadRequestException(
        `Category limit reached (${count}/${USER_LIMITS.categories}). Delete unused categories to create new ones.`,
      );
    }

    try {
      return await this.prisma.category.create({ data: { ...dto, userId } });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Returns the user's own categories plus all global system categories,
   * so users always have access to built-in types like "Adjustment".
   */
  async findAll(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystem: true }],
      },
      orderBy: { name: 'asc' },
      take: 250,
    });
  }

  /**
   * Returns a single category accessible to the user (owned or system).
   * @throws NotFoundException when the category is not found or not accessible
   */
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

  /**
   * Updates a user-owned category. System categories are immutable.
   * @throws NotFoundException when the category does not exist or belongs to another user
   * @throws BadRequestException when attempting to modify a system category
   * @throws ConflictException on P2002 — duplicate name after rename
   */
  async update(
    id: string,
    dto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
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

  /**
   * Deletes a user-owned category. System categories are protected from deletion.
   * @throws NotFoundException when the category does not exist or belongs to another user
   * @throws BadRequestException on system category or P2003 — category still referenced by transactions
   */
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
      // P2003: foreign key constraint — transactions still reference this category
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete category with existing transactions. Reassign or delete them first.',
        );
      }
      throw error;
    }
  }
}
