import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
