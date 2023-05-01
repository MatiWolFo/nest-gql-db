import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ValidRoles } from '../enums/valid-roles.enum';
import { User } from 'src/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  // tiene ciertos argumentos
  // importar ENUM array de roles
  (roles: ValidRoles[] = [], context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user: User = ctx.getContext().req.user;
    if (!user) {
      throw new InternalServerErrorException('No user inside the request');
    }
    if (roles.length === 0) {
      return user;
    }
    // for of para barrer los roles
    for (const role of user.roles) {
      if (roles.includes(role as ValidRoles)) {
        return user;
      }
    }
    // si no encuentra un rol valido
    throw new ForbiddenException(
      `User ${user.email} needs a valid role: ${roles}...`
    );
  },
);
