import { InputType, Field, ID } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class CreateListItemInput {
  @Field(() => Number, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => ID)
  @IsUUID()
  itemId: string;
}
