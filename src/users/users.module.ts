import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { User } from './entities/user.entity';


@Module({
  providers: [UsersResolver, UsersService],
  // pasar la entity tipo class al modulo
  imports: [TypeOrmModule.forFeature([User])],
  // para exportar servicios de este modulo a cualquiera
  exports: [UsersService],
})
export class UsersModule { }
