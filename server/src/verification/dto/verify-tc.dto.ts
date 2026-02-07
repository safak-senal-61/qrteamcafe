import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class VerifyTcDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 11)
  tc: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear: number;
}
