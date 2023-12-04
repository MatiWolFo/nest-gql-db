import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import { List } from 'src/lists/entities/list.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('listItems')
// esto evita que se repita la combinacion de listId y itemId en la tabla
@Unique('listItem-item', ['list', 'item'])
@ObjectType()
export class ListItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Number)
  @Column()
  quantity: number;

  @Field(() => Boolean)
  @Column()
  completed: boolean;

  //! RELACIONES CON OTRAS TABLAS, ESTO ES UNA TABLA INTERMEDIA
  // varias listas pueden contenerse en 1 lista
  @ManyToOne(() => List, (list) => list.listItem, {
    lazy: true,
  })
  @Field(() => List)
  list: List;

  // varias listas pueden contener el 1 item
  @ManyToOne(() => Item, (item) => item.listItem, {
    lazy: true,
  })
  @Field(() => Item)
  item: Item;
}
