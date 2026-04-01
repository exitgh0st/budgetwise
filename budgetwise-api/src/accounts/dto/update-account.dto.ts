import { IsString, IsEnum, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'GCash' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AccountType, example: AccountType.EWALLET })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ example: 5000, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.maintainingBalance !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  maintainingBalance?: number | null;
}
