import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { InjectRepository } from '@nestjs/typeorm';
import { List } from './entities/list.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listsRespository: Repository<List>,
  ) { }

  async create(createListInput: CreateListInput, user: User): Promise<List> {
    const newList = this.listsRespository.create({ ...createListInput, user });
    await this.listsRespository.save(newList);
    return newList;
  }

  async findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<List[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.listsRespository
      .createQueryBuilder()
      .take(limit)
      .skip(offset)
      .where(`"userId" = :userId`, { userId: user.id });

    if (search) {
      queryBuilder.andWhere('LOWER("name") LIKE :name', {
        name: `%${search.toLowerCase()}%`,
      });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<List> {
    const list = await this.listsRespository.findOneBy({
      id,
      user: {
        id: user.id,
      },
    });
    if (!list) {
      throw new NotFoundException(`List of ID #${id} not found`);
    }
    return list;
  }

  async update(
    id: string,
    updateListInput: UpdateListInput,
    user: User,
  ): Promise<List> {
    await this.findOne(id, user);
    const editList = await this.listsRespository.preload({
      ...updateListInput,
      user,
    });

    if (!editList) {
      throw new NotFoundException(`List of ID #${id} not found`);
    }

    return this.listsRespository.save(editList);
  }

  async remove(id: string, user: User): Promise<List> {
    const list = await this.findOne(id, user);
    await this.listsRespository.remove(list);
    return { ...list, id };
  }

  async listCountByUser(user: User): Promise<number> {
    return await this.listsRespository.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }
}
