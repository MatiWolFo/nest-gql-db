# INSTALAR TODOS EL CRUD DE UNA

nest g res items --no-spec
GraphQL code first

# CONECTAR A DB USANDO DOCKER

en root crear docker-compose.yml

```yml
version: '3'

services:
  db:
    image: postgres:14.4
    restart: always
    ports:
      - '5432:5432'
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    container_name: anylistDB
    # volumes preserva la data a pesar de poder destruir el contenedor, es un puente entre la carpeta en el arbol de componentes y la carpeta del contenedor
    volumes:
      - /postgres:var/lib/postgresql/data
      # the volume path must be absolute, run PWD in terminal and copy paste the path
```

## crear .env para meterle variables de entorno al yml

```ts
STATE = dev;

DB_PASSWORD = xxxx;
DB_NAME = xxxx;
DB_HOST = xxxx;
DB_PORT = 5432;
DB_USERNAME = xxxx;
```

## recordar agregar las env y la carpeta postgres al gitignore

/postgres
.env
.env/

## conectar a tablePlus o similar para ver y administrar la db usando las .env

## para que NEST pueda leer las variables de entorno

yarn add @nestjs/config

y agregar al app.module:

```ts
import { ConfigModule } from '@nestjs/config';

ConfigModule.forRoot(),
```

## instalar y configurar typeORM a postgres

yarn add @nestjs/typeorm typeorm pg

```ts
TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
```

QUEDARIA COMO ESTO

```ts
TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadEntities: true,
    }),
```

no olvidar cambiar las variables de entorno respectivas

## importar entidad o schema en el modulo respectivo:

```ts
import { TypeOrmModule } from '@nestjs/typeorm';

imports: [TypeOrmModule.forFeature([NOMBRE DE LA ENTIDAD])]
```

## Agregar los FIELDS de GQL a la entidad o schema, para que no falle el start:dev

con estos pasos, ya esta todo correctamente conectado a la db.

## flujo recomendado:

resolver> input > repository > service

PARA VALIDACIONES DE DATOS:
yarn add class-validator class-transformer

y configurarlo en la app:

```ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```
