import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';
import { Repository } from 'typeorm';
import { List } from 'src/lists/entities/list.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ListItemService {
  constructor(
    @InjectRepository(ListItem)
    private readonly listItemRespository: Repository<ListItem>,
  ) { }

  async create(createListItemInput: CreateListItemInput): Promise<ListItem> {
    // desestructura para asignar a una variable el valor de listId y itemId, el resto en rest operator
    const { listId, itemId, ...rest } = createListItemInput;
    const newListItem = this.listItemRespository.create({
      // y exparsionamos el resto
      ...rest,
      item: { id: itemId },
      list: { id: listId },
    });

    await this.listItemRespository.save(newListItem);

    // truco para regresar toda la informacion del nuevo listItem sin hacer marcar manualmente en apollo o el front para bypassear el error de no se puede retornar algo null
    return this.findOne(newListItem.id);
  }

  async findAll(
    list: List,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<ListItem[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.listItemRespository
      .createQueryBuilder('listItem')
      .innerJoin('listItem.item', 'item') // con innerJoin se hace un join con la tabla item usando el alias item desde listItems.item
      .take(limit)
      .skip(offset)
      // crea la query con el where y usa el valor de user.id, as :userId que apunta a la columna "userId"
      .where(`"listId" = :listId`, { listId: list.id });

    if (search) {
      queryBuilder.andWhere('LOWER("item.name") like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    }

    return await queryBuilder.getMany();
  }

  async countListItemsByList(list: List): Promise<number> {
    return this.listItemRespository.count({
      where: { list: { id: list.id } },
    });
  }

  async findOne(id: string): Promise<ListItem> {
    const listItem = await this.listItemRespository.findOneBy({
      id,
    });
    if (!listItem) {
      throw new NotFoundException(`ListItem of ID #${id} not found`);
    }
    return listItem;
  }

  async update(
    id: string,
    updateListItemInput: UpdateListItemInput,
  ): Promise<ListItem> {
    const { itemId, listId, ...rest } = updateListItemInput;

    // al tener el uso de constraint y el unique, no deja actualizar la columna objetivo, para eso mejor usar queryBuilder
    // const editListItem = await this.listItemRespository.preload({
    //   ...rest,
    //   item: { id: itemId },
    //   list: { id: listId },
    // });

    // if (!editListItem) {
    //   throw new NotFoundException(`ListItem of ID #${id} not found`);
    // }

    // return this.listItemRespository.save(editListItem);

    const queryBuilder = this.listItemRespository
      .createQueryBuilder()
      .update(ListItem)
      .set(rest)
      .where('id = :id', { id });

    // los otros campos se ejecutan solo si se envian
    if (listId) {
      queryBuilder.set({ list: { id: listId } });
    }

    if (itemId) {
      queryBuilder.set({ item: { id: itemId } });
    }

    // lo malo de queryBuilder es que no devuelve el objeto actualizado, solo el numero de filas afectadas
    await queryBuilder.execute();

    // para resolver esto, se hace una consulta por el id del listItem
    return this.findOne(id);
  }

  remove(id: number) {
    return `This action removes a #${id} listItem`;
  }
}
