import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

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

  async findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<Item[]> {
    // se le agregan los argumentos de paginacion y filtrado
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    // return await this.itemsRepository.find({
    //   // aplica TAKE para tomar los argumentos de paginacion y el SKIP para usar un offset
    //   take: limit,
    //   skip: offset,
    //   where: {
    //     user: {
    //       id: user.id,
    //     },
    //     // aca se agrega la busqueda semantica del search, usar Like de typeorm para evitar SQL injection
    //     name: Like(`%${search}%`),
    //   },
    // });

    // ! AGREGANDO UN QUERY BUILDER para hacer una consulta mas compleja de forma dinamica y mas simple
    const queryBuilder = this.itemsRepository
      .createQueryBuilder()
      .take(limit)
      .skip(offset)
      // crea la query con el where y usa el valor de user.id, as :userId que apunta a la columna "userId"
      .where(`"userId" = :userId`, { userId: user.id });

    if (search) {
      // si hay un search, se agrega el where con el queryBuilder
      // queryBuilder.orWhere('LOWER("name") like :name', {
      //   name: `%${search.toLowerCase()}%`,
      // });

      // queryBuilder.orWhere('LOWER("quantityUnits") LIKE :quantityUnits', {
      //   quantityUnits: `%${search.toLowerCase()}%`,
      // });
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.orWhere('LOWER("name") LIKE :name', {
            name: `%${search.toLowerCase()}%`,
          }).orWhere('LOWER("quantityUnits") LIKE :quantityUnits', {
            quantityUnits: `%${search.toLowerCase()}%`,
          });
        }),
      );
    }

    return await queryBuilder.getMany();
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
