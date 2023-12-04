import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { User } from './entities/user.entity';
import { ItemsModule } from 'src/items/items.module';
import { ListsModule } from 'src/lists/lists.module';
import { ListsService } from 'src/lists/lists.service';


@Module({
  providers: [UsersResolver, UsersService, ListsService],
  // pasar la entity tipo class al modulo
  imports: [TypeOrmModule.forFeature([User]), ItemsModule, ListsModule],
  // para exportar servicios de este modulo a cualquiera
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule { }
