import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { User } from './entities/user.entity';
import { ItemsModule } from 'src/items/items.module';


@Module({
  providers: [UsersResolver, UsersService],
  // pasar la entity tipo class al modulo
  imports: [TypeOrmModule.forFeature([User]), ItemsModule],
  // para exportar servicios de este modulo a cualquiera
  exports: [UsersService],
})
export class UsersModule { }
