import { registerEnumType } from '@nestjs/graphql';

export enum ValidRoles {
  admin = 'admin',
  user = 'user',
  superUser = 'superUser',
}
// se necesita registrar la enumeracion
// esto va a hacer que no se pueda meter cualquier dato
registerEnumType(ValidRoles, {
  name: 'ValidRoles',
  description: 'Deja seleccionar valores dentro de ValidRoles',
});
