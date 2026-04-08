import {
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalType } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({ enum: GoalType, example: GoalType.SAVINGS })
  @IsEnum(GoalType)
  type!: GoalType;

  @ApiProperty({ example: 'Emergency Fund' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 50000, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  targetAmount!: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: 'uuid-of-account' })
  @IsOptional()
  @IsString()
  accountId?: string;
}
