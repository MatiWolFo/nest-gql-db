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

## basicos de docker CLI

docker-compose up crear
docker-compose down borrar
docker-compose up -d crear detached
docker-compose down -v borrar y borrar volumenes
docker-compose stop detener

## conectar a tablePlus o similar para ver y administrar la db usando las .env

abrir tableplus > click derecho > new connection > postgres > localhost > user: postgres > password: xxxx > database: xxxx > save > connect

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

# CREANDO AUTH

toma javascript web tokens, para proteger las rutas y el acceso a la db

el modulo de AUTH se comunica y hace join con el modulo de USERS para darle mantenimiento, tiene una dependencia mutua

el InputType es la informacion que la query o mutation espera recibir

el ObjectType es lo que espera devolver

el AuthResponse es una representacion abstracta

para nest, si quiero usar algun item de un modulo en otro, tiene que estar importado en el ALGO.module, con exports: [algoService] e importado en el modulo que quiero que lo use con imports: [algoModule] (incluye todo lo que esta dentro de ese module, includio el service a usar)

## encriptar passwords

yarn add bcrypt
importarlo:
import \* as bcrypt from 'bcrypt';

luego
yarn add -D @types/bcrypt

lo bueno, es que si 2 passwords son iguales no importa, genera crypted distintos

## modulos pasaporte y jwt (tokens)

yarn add @nestjs/passport passport

yarn add @nestjs/jwt passport-jwt
yarn add -D @types/passport-jwt

## seeds secrets

en el archivo .env

```ts
JWT_SECRET = ALGO;
JWT_EXPIRES = ALGO;
```

luego, configurar los imports en el modulo auth o app

```ts
imports: [
    ConfigModule,
    // importar passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // importar JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      //useFactory para definir de manera async la creacion del modulo auth
      useFactory: (configService: ConfigService) => ({
        // retorna un objeto, verificar sus valores
        // console.log(configService.get('JWT_SECRET'));
        // console.log(configService.get('JWT_EXPIRES'));
        secret: configService.get('nombre en env'),
        signOptions: {
          expiresIn: configService.get('nombre en env'),
        },
      }),
    }),
    UsersModule,
  ],
```

## JWT configuracion

es un provider

crear archivo algo.strategy.ts

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }
  async validate(payload: any): Promise<User> {
    throw new UnauthorizedException('Token not valid...');
  }
}
```

luego, en el auth.service:

```ts
//en el constructor
private readonly jwtService: JwtService,

// dentro del signUp y el login
    const token = this.jwtService.sign({ id: user.id });
```

## JWT auth guard

useGuard de API no funciona en GQL

crear el archivo jwt-auth.guard.ts

```ts
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {
  // ! override
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request;
  }
}
```

## jwt-interface

no crea instancias de nada, es solo para verificar el payload

## decorator

para usar la query revalidateToken usando el usuario logeado

curent User usa el contexto entregado por el decorador creado

en este ejemplo, los roles se implementan como un ENUM

## proteger rutas

@useGuards(JwtAuthGuard) en el resolver objetivo

# SEED DATA - cargar y purgar db

usar junto a docker, que mantiene la DB aislada, -d en detach, tener una seed permite cargar datos de forma masiva

crear el seed en un modulo nuevo, `nest g res seed --no-spec` para que no cree la prueba

crear un folder `data` e incluir el file con los datos a cargar

Luego: crear resolver, crear service, los metodos

## proteccion de la ejecucion del seed

```ts
agrega este flag en el seed service
private isProd: boolean;
```

# paginacion y filtros

Se crea una CLASS ARGS para la query, que recibe los parametros de paginacion y filtros `nest g mo common`, ya que es un dto que se puede usar en varios modulos en la app

la estructura basica de un pagination args es:

```ts
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @Min(1)
  limit?: number;
}
```

Luego, agregar estos ARGS en la query del resolver de preferencia usando

```ts
take: limit,
skip: offset,
```

Para agregar un filtro de tipo search, se crea un nuevo dto, que recibe el string de busqueda, con condiciones opcionales

```ts
import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@ArgsType()
export class SearchArgs {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
```

Para evitar problemas usando variados ARGS, desactivar `forbidNonWhitelisted: true,` en el main.ts

## creacion de una lista merge de 2 tablas, o tabla intermedia

una tabla intermedia, generalmente trabaja con ManyToOne en la intermedia, y OneToMany en las tablas que se relacionan con la intermedia

```ts
EJ:
// tabla intermedia
  @ManyToOne(() => List, (list) => list.listItem, {
    lazy: true,
  })
  @Field(() => List)
  list: List;

  @ManyToOne(() => Item, (item) => item.listItem, {
    lazy: true,
  })
  @Field(() => Item)
  item: Item;

// tabla origen 1
  @OneToMany(() => ListItem, (listItem) => listItem.list, {
    lazy: true,
  })
  @Field(() => [ListItem])
  listItem: ListItem[];

// tabla origen 2
  @OneToMany(() => ListItem, (listItem) => listItem.item, {
    lazy: true,
  })
  @Field(() => [ListItem])
  listItem: ListItem[];
```

## constraints

ayudan a evitar duplicados en la db, se pueden usar en las entidades via typeORM

```ts
@Unique('listItem-item', ['list','item']).
```

## problemas de dependencias circulares

para solucionar esto, se puede usar el forwardRef, que permite importar un modulo que aun no ha sido creado, pero que se creara en el futuro

```ts
import { forwardRef, Module } from '@nestjs/common';

imports: [forwardRef(() => exampleBModule)]; // en modulo A,
imports: [forwardRef(() => exampleAModule)]; // en modulo B
```

# DESPLIEGUE (solo parte de docker)

## crear imagen dockerFile

hacer una configuracion en docker-compose.yml para explicar como se va a crear la imagen

Build
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build

Run
docker-compose -f docker-compose.prod.yml --env-file .env.prod up

Nota
Por defecto, docker-compose usa el archivo .env, por lo que si tienen el archivo .env y lo configuran con sus variables de entorno de producción, bastaría con

docker-compose -f docker-compose.prod.yml up --build
Cambiar nombre
docker tag <nombre app> <usuario docker hub>/<nombre repositorio>
Ingresar a Docker Hub

docker login
Subir imagen

docker push <usuario docker hub>/<nombre repositorio>
