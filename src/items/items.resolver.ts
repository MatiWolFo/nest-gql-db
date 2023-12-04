import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

@Resolver(() => Item)
@UseGuards(JwtAuthGuard)
export class ItemsResolver {
  constructor(private readonly itemsService: ItemsService) { }

  // toda interaccion con la db ES ASYNC, se deben manejar funciones asincronas
  @Mutation(() => Item, {
    name: 'createItem',
    description: 'create an item to DB',
  })
  async createItem(
    @Args('createItemInput') createItemInput: CreateItemInput,
    // entregarle el decorador de usuario al item creado
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.create(createItemInput, user);
  }

  @Query(() => [Item], {
    name: 'findAllItems',
    description: 'get all items in DB',
  })
  async findAll(
    @CurrentUser() user: User,
    // asigna e importa los argumentos de paginacion usables por toda la app
    @Args() paginationArgs: PaginationArgs,
    @Args() searchArgs: SearchArgs,
  ): Promise<Item[]> {
    return this.itemsService.findAll(user, paginationArgs, searchArgs);
  }

  @Query(() => Item, {
    name: 'findItemById',
    description: 'get items in DB by ID',
  })
  async findOne(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.findOne(id, user);
  }

  @Mutation(() => Item, {
    name: 'updateItemById',
    description: 'update an item in DB by ID',
  })
  updateItem(
    @Args('updateItemInput') updateItemInput: UpdateItemInput,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.update(updateItemInput.id, updateItemInput, user);
  }

  @Mutation(() => Item, {
    name: 'deleteItemById',
    description: 'delete an item by ID',
  })
  removeItem(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.remove(id, user);
  }
}
