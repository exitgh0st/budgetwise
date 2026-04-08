import {
  IsEnum,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
} from 'class-validator';
import { TransactionType, RecurringFrequency } from '@prisma/client';

export class CreateScheduledTransactionDto {
  @IsEnum(TransactionType)
  @IsIn([TransactionType.INCOME, TransactionType.EXPENSE])
  type!: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @IsDateString()
  nextDueDate!: string;

  @IsString()
  accountId!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalInstallments?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedInstallments?: number;
}
