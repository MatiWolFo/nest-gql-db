import { InputType, Float, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

@InputType()
export class CreateItemInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive()
  quantity?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quantityUnits?: string;
}
