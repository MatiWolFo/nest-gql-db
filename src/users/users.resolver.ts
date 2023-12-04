import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Int,
  Parent,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ValidRolesArgs } from './dto/args/roles.arg';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { UpdateUserInput } from './dto/update-user.input';
import { ItemsService } from 'src/items/items.service';
import { Item } from 'src/items/entities/item.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';
import { List } from 'src/lists/entities/list.entity';
import { ListsService } from 'src/lists/lists.service';

@Resolver(() => User)
// protege todo el resolver
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly listsService: ListsService,
  ) { }

  @Query(() => [User], { name: 'findAllUsers' })
  findAll(
    // agregar ARGS de validRoles, es el tipo del parametro
    @Args() validRoles: ValidRolesArgs,
    // agregar el decorador currentUser y sus roles validos
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User,
  ): Promise<User[]> {
    return this.usersService.findAll(validRoles.roles);
  }

  @Query(() => User, { name: 'findOneUserByID' })
  findOne(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User,
  ): Promise<User> {
    return this.usersService.findOneById(id);
  }

  @Mutation(() => User, { name: 'blockUserByID' })
  blockUser(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin]) user: User,
  ): Promise<User> {
    return this.usersService.block(id, user);
  }

  @Mutation(() => User, { name: 'updateUserByID' })
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser([ValidRoles.admin]) user: User,
  ): Promise<User> {
    return this.usersService.updateUserById(
      updateUserInput.id,
      updateUserInput,
      user,
    );
  }

  //! AGREGANDO UN RESOLVEFIELD, UN VALOR CALCULADO PARTE 1 REF CRUZADA
  @ResolveField(() => Int, { name: 'itemCount' })
  async itemCount(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    // obtener toda la informacion del padre que se le pase como parametro
    @Parent() user: User,
  ): Promise<number> {
    // usar el usuario para calcular el numero de items que tiene ese usuario
    return this.itemsService.itemCountByUser(user);
  }

  @ResolveField(() => [Item], { name: 'items' })
  async items(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    @Parent() user: User,
    // se le agregan los ARGS de busqueda y paginacion
    // esto hace que el campo calculado por el resolvefield pueda usar los argumentos de busqueda y paginacion
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs,
  ): Promise<Item[]> {
    return this.itemsService.findAll(user, paginationArgs, searchArgs)
  }

  @ResolveField(() => Int, { name: 'listCount' })
  async listCount(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    @Parent() user: User,
  ): Promise<number> {
    return this.listsService.listCountByUser(user);
  }

  @ResolveField(() => [List], { name: 'lists' })
  async lists(
    @CurrentUser([ValidRoles.admin]) adminUser: User,
    @Parent() user: User,
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs,
  ): Promise<List[]> {
    return this.listsService.findAll(user, paginationArgs, searchArgs)
  }
}
