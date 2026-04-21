import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';
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
  // ValidateIf skips @IsNumber when the field is explicitly null (clear intent),
  // but still validates it when it's a non-null value.
  @ValidateIf((dto: UpdateAccountDto) => dto.maintainingBalance !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  maintainingBalance?: number | null;

  @ApiPropertyOptional({ example: 'bdo', nullable: true })
  @IsOptional()
  // ValidateIf skips @IsString when the field is explicitly null (clear intent)
  @ValidateIf((dto: UpdateAccountDto) => dto.providerId !== null)
  @IsString()
  providerId?: string | null;
}
