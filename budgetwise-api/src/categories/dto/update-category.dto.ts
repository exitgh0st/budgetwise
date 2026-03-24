import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Groceries' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '🛒' })
  @IsOptional()
  @IsString()
  icon?: string;
}
