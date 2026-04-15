import { IsIn, IsString } from 'class-validator';
import { SUPPORTED_CURRENCY_CODES } from '../currency.constants';

export class UpdateUserPreferencesDto {
  @IsString()
  @IsIn([...SUPPORTED_CURRENCY_CODES])
  currency!: string;
}
