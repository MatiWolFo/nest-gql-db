import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthService } from '../auth.service';

//! realiza la verificacion del payload de la mutation LOGIN, por lo menos, validacion
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // importar configService constructor
  constructor(
    // iinyectar el AuthService
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    // super, necesita ser inicializado de cierta manera, con secretOrKey
    super({
      // cual es la llave a usar
      secretOrKey: configService.get('JWT_SECRET'),
      // y de donde viene, el bearer es del auth header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  //! validar la informacion entrante desde el super()
  async validate(payload: JwtPayload): Promise<User> {
    // a traves del payload, verificar que el usuario existe
    const { id } = payload;
    // llama la funcion en el service respectivo
    const user = await this.authService.validateUser(id);
    return user; // AKA req.user
  }
}
