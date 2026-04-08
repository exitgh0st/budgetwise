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
import {
  TransactionType,
  RecurringFrequency,
  BillStatus,
} from '@prisma/client';

export class UpdateBillDto {
  @IsOptional()
  @IsEnum(TransactionType)
  @IsIn([TransactionType.INCOME, TransactionType.EXPENSE])
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

  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalInstallments?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedInstallments?: number;
}
