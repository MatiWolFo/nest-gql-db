import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SEED_ITEMS, SEED_LISTS, SEED_USERS } from './data/seed-data';
import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { List } from 'src/lists/entities/list.entity';
import { ListItemService } from 'src/list-item/list-item.service';
import { ListsService } from 'src/lists/lists.service';

@Injectable()
export class SeedService {
  // al agregarle esta propiedad, permite que el servicio sepa si la app esta en modo prod o dev y ejecute el seed
  private isProd: boolean;

  constructor(
    private readonly configService: ConfigService,
    // inyectar los repositorios de Users y Items, con sus entidades
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ListItem)
    private readonly listItemRepository: Repository<ListItem>,
    // inyectar el servicio de Users
    private readonly usersService: UsersService,
    // inyectar el servicio de Items
    private readonly itemsService: ItemsService,
    private readonly listService: ListsService,
    private readonly listItemService: ListItemService,
  ) {
    // isProd solo sera true si el estado de la app es prod, por defecto es false === dev, ver el archivo .env
    this.isProd = this.configService.get('STATE') === 'prod';
  }

  async executeSeed(): Promise<boolean> {
    // verificar si la app esta en modo prod o dev
    if (this.isProd) {
      // lanza error para que no se ejecute nada mas
      throw new UnauthorizedException('SEED allowed only in dev mode');
    }
    // limpiar la base de datos, BORRAR TODO, usando el TypeOrmModule (inyectar el repositorio)
    await this.deleteDatabase();
    // crear los datos de prueba PARA USUARIOS
    const user = await this.loadUsers();
    // crear los datos de prueba PARA ITEMS
    await this.loadItems(user);

    const lists = await this.loadLists(user);

    // crear listsItems usando un metodo del serviciio de items, manda los 3 argumentos, el tercero va vacio porqu no se usa y es nulleable
    const items = await this.itemsService.findAll(
      user,
      { limit: 10, offset: 0 },
      {},
    );
    await this.loadListItems(lists, items);

    return true;
  }

  // ! BORRAR LAS TABLAS EN ORDEN DEPENDIENDO DE LAS RELACIONES
  async deleteDatabase() {
    // borrar listItems
    await this.listItemRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();
    // borrar items
    await this.itemsRepository
      .createQueryBuilder()
      .delete()
      // al usar el where vacio, borra todos los elementos
      .where({})
      .execute();
    // borrar usuarios
    await this.listRepository.createQueryBuilder().delete().where({}).execute();
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();
  }

  // ! CREAR LOS DATOS DE PRUEBA EN ORDEN DEPENDIENDO DE LAS RELACIONES
  async loadUsers(): Promise<User> {
    const users = [];
    for (const user of SEED_USERS) {
      users.push(await this.usersService.create(user));
    }
    return users[0];
  }

  async loadItems(user: User): Promise<void> {
    const items = [];
    for (const item of SEED_ITEMS) {
      items.push(
        await this.itemsService.create(
          {
            name: item.name,
            quantityUnits: item.quantityUnits,
            quantity: Math.round(Math.random() * 10),
          },
          user,
        ),
      );
    }
    await Promise.all(items);
  }

  async loadLists(user: User): Promise<List> {
    const lists = [];
    for (const list of SEED_LISTS) {
      lists.push(await this.listService.create(list, user));
    }
    return lists[0];
  }

  async loadListItems(list: List, items: Item[]): Promise<void> {
    for (const item of items) {
      this.listItemService.create({
        // ! AGREGANDO ALEATORIEDAD
        quantity: Math.round(Math.random() * 10),
        completed: Math.round(Math.random() * 1) === 0 ? false : true,
        itemId: item.id,
        listId: list.id,
      });
    }
  }
}
