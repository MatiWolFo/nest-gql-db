import { Module, forwardRef } from '@nestjs/common';
import { ListItemService } from './list-item.service';
import { ListItemResolver } from './list-item.resolver';
import { ListItem } from './entities/list-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsModule } from 'src/items/items.module';
import { ListsModule } from 'src/lists/lists.module';

@Module({
  providers: [ListItemResolver, ListItemService],
  imports: [
    TypeOrmModule.forFeature([ListItem]),
    ItemsModule,
    forwardRef(() => ListsModule),
  ],
  exports: [TypeOrmModule, ListItemService],
})
export class ListItemModule { }
