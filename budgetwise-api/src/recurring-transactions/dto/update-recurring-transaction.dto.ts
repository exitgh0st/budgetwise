import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType, RecurringFrequency } from '@prisma/client';

export class UpdateRecurringTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
