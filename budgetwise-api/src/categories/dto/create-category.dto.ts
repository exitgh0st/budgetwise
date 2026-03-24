import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Food & Dining' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '🍔' })
  @IsOptional()
  @IsString()
  icon?: string;
}
