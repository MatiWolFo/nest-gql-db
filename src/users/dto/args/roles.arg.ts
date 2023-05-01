import { ArgsType, Field } from '@nestjs/graphql';
import { IsArray } from 'class-validator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@ArgsType()
export class ValidRolesArgs {
  //field para el graphQL con decorador
  @Field(() => [ValidRoles], { nullable: true })
  //classValidator
  @IsArray()
  //se importa el arreglo y por defecto tiene valor vacio
  roles: ValidRoles[] = [];
}
