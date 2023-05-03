import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  fullName: string;

  @Field(() => String)
  @Column({ unique: true })
  email: string;

  @Field(() => String)
  @Column()
  password: string;

  // agregando reglas especiales a esta columna
  @Field(() => [String])
  @Column({
    type: 'text',
    array: true,
    default: ['user'],
  })
  roles: string[];

  @Field(() => Boolean)
  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  //! IMPLEMENTANDO LAS RELACIONES EN DB
  // no olvidar que field es para GQL y lo demas para el repo de la db
  @Field(() => User, { nullable: true })
  // como se relacionan las dos y como hacen join las tablas
  @ManyToOne(() => User, (user) => user.updatedBy, {
    nullable: true,
    lazy: true,
  })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy?: User;

  //! RELACION ITEM-USUARIO
  @Field(() => [Item])
  @OneToMany(() => Item, (item) => item.user, { nullable: false, lazy: true })
  items: Item[];
}
