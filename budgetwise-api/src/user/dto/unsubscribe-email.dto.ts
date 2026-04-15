import { IsString } from 'class-validator';

export class UnsubscribeEmailDto {
  @IsString()
  token!: string;
}
