import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { ItemsModule } from 'src/items/items.module';
import { ListItemModule } from 'src/list-item/list-item.module';
import { ListsModule } from 'src/lists/lists.module';

@Module({
  providers: [SeedResolver, SeedService],
  // importar el configModule para poder usar el ConfigService en el SeedService
  // importar los modulos de Users y Items para poder usar sus servicios en el SeedService
  imports: [
    ConfigModule,
    UsersModule,
    ItemsModule,
    ListItemModule,
    ListsModule,
  ],
})
export class SeedModule { }
