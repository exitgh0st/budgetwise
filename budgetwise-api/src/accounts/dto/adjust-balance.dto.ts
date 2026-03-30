import { IsNumber } from 'class-validator';

export class AdjustBalanceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  newBalance: number;
}
