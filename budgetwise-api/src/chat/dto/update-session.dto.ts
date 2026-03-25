import { IsString } from 'class-validator';

export class UpdateSessionDto {
  @IsString()
  title: string;
}
