import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType, RecurringFrequency } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsDateString()
  nextDueDate: string;

  @IsString()
  accountId: string;

  @IsString()
  categoryId: string;
}
