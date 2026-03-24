import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 500, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Grocery shopping' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-account' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: '2026-03-24T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
