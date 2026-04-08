import {
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GoalType } from '@prisma/client';

export class UpdateGoalDto {
  @ApiPropertyOptional({ enum: GoalType })
  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @ApiPropertyOptional({ example: 'Emergency Fund' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 50000, minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  targetAmount?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T00:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @ApiPropertyOptional({ example: 'uuid-of-account', nullable: true })
  @IsOptional()
  @IsString()
  accountId?: string | null;
}
