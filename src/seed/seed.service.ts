import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SEED_ITEMS, SEED_USERS } from './data/seed-data';
import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';

@Injectable()
export class SeedService {
  private isProd: boolean;
  constructor(
    private readonly configService: ConfigService,
    // inyectar los repositorios de Users y Items, con sus entidades
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    // inyectar el servicio de Users
    private readonly usersService: UsersService,
    // inyectar el servicio de Items
    private readonly itemsService: ItemsService,
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

    return true;
  }

  // ! BORRAR LAS TABLAS EN ORDEN DEPENDIENDO DE LAS RELACIONES
  async deleteDatabase() {
    // borrar items
    await this.itemsRepository
      .createQueryBuilder()
      .delete()
      // al usar el where vacio, borra todos los elementos
      .where({})
      .execute();
    // borrar usuarios
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
      items.push(await this.itemsService.create(item, user));
    }
    await Promise.all(items);
  }
}
