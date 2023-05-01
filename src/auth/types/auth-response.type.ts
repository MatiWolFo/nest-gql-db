import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field(() => String)
  token: string;

  // Importando desde el modulo USER, dependencia heredada, SOLO DE FIELDS, los calculados no los recibe
  @Field(() => User)
  user: User;
}
