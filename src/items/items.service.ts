import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ItemsService {
  // antes de comenzar a hacer la logica de negocio, hay que injectar un constructor de repositorio y compartirle la entidad o schema
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) { }
  // recordar manejarlo como ASYNC AWAIT, retorna una promesa
  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    // pasarle directamente al create con spread
    const newItem = this.itemsRepository.create({ ...createItemInput, user });
    await this.itemsRepository.save(newItem);
    return newItem;
  }

  async findAll(user: User): Promise<Item[]> {
    return await this.itemsRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }

  async findOne(id: string, user: User): Promise<Item> {
    const item = await this.itemsRepository.findOneBy({
      id,
      // al entregar el current user, solo hace consultas por el id que haga match con el user
      user: {
        id: user.id,
      },
    });
    if (!item) {
      throw new NotFoundException(`Item of ID #${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateItemInput: UpdateItemInput,
    user: User,
  ): Promise<Item> {
    // usar el metodo de encontrar uno por ID de este servicio
    await this.findOne(id, user);
    // preload es similar a findOneBy ID, pero si lo encuentra carga todo el item
    const editItem = await this.itemsRepository.preload({
      ...updateItemInput,
      user,
    });

    if (!editItem) {
      throw new NotFoundException(`Item of ID #${id} not found`);
    }

    return this.itemsRepository.save(editItem);
  }

  async remove(id: string, user: User): Promise<Item> {
    // llamando a otro metodo, en este caso findOne, de este mismo servicio
    const deleteItem = await this.findOne(id, user);
    await this.itemsRepository.remove(deleteItem);
    return { ...deleteItem, id };
  }

  //! AGREGANDO UN RESOLVEFIELD, UN VALOR CALCULADO PARTE 2 REF CRUZADA
  async itemCountByUser(user: User): Promise<number> {
    return await this.itemsRepository.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }
}
