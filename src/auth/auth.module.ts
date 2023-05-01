import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthResolver, AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, JwtModule],
  // importando modulos de servicio desde otro distinto, importando TODO lo que ese modulo contenga
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
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES'),
        },
      }),
    }),
    UsersModule,
  ],
})
export class AuthModule { }
