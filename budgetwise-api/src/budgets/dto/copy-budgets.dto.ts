import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CopyBudgetsDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  sourceMonth: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsNumber()
  sourceYear: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  targetMonth: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsNumber()
  targetYear: number;

  @ApiPropertyOptional({
    example: ['uuid-of-category-1', 'uuid-of-category-2'],
    description: 'Optional subset of source budget category IDs to copy',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  categoryIds?: string[];
}
