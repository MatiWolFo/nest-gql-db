import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'items' })
@ObjectType()
export class Item {
  @Field(() => ID)
  // generando la entidad que va a dar a la tabla de la db con TYPEORM
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  name: string;

  @Field(() => Float)
  @Column()
  quantity: number;

  // este campo es COMPLETAMENTE OPCIONAL, el primer nullable es de graphQL, el segundo es de la DB
  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  quantityUnits?: string;

  //! RELACION ITEM-USUARIO
  // establece una instancia, segundo, establece que instancia de otra tabla es la que relaciona, hay que crear la relacion en ambas partes, ej. item - user
  // primero graphQL
  @Field(() => User)
  // luego TypeORM de la DB, al agregar lazy, trae los datos del USER corrspondiente a la consulta
  @ManyToOne(() => User, (user) => user.items, { nullable: false, lazy: true })
  // le dice a la operacion que va a usar 'ESTE' campo para la operacion
  @Index('userId-index')
  user: User;
}
