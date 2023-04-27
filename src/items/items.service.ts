import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  // antes de comenzar a hacer la logica de negocio, hay que injectar un constructor de repositorio y compartirle la entidad o schema
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) { }
  // recordar manejarlo como ASYNC AWAIT, retorna una promesa
  async create(createItemInput: CreateItemInput): Promise<Item> {
    const newItem = this.itemsRepository.create(createItemInput);
    await this.itemsRepository.save(newItem);
    return newItem;
  }

  async findAll(): Promise<Item[]> {
    return await this.itemsRepository.find();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Item of ID #${id} not found`);
    }
    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
    // preload es similar a findOneBy ID, pero si lo encuentra carga todo el item
    const editItem = await this.itemsRepository.preload(updateItemInput);

    if (!editItem) {
      throw new NotFoundException(`Item of ID #${id} not found`);
    }

    return this.itemsRepository.save(editItem);
  }

  async remove(id: string): Promise<Item> {
    // llamando a otro metodo, en este caso findOne, de este mismo servicio
    const deleteItem = await this.findOne(id);
    await this.itemsRepository.remove(deleteItem);
    return { ...deleteItem, id };
  }
}
