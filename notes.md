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
