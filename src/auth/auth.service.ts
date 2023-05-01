import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpInput, LoginInput } from './dto/inputs';
import { AuthResponse } from './types/auth-response.type';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    // importando otro service en este service para usar sus funciones
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }
  // creando el bloque constante para no repetirlo manualmente en ambas mutation
  private getJWT(userId: string) {
    return this.jwtService.sign({ id: userId });
  }

  // ! CREAR UN NUEVO USUARIO
  async signUp(signUpInput: SignUpInput): Promise<AuthResponse> {
    // usando una funcion de un service externo
    const user = await this.usersService.create(signUpInput);
    // ! IMPLEMENTAR JWT
    // usa la ID del usuario, se puede sacar toda la informacion con eso
    const token = this.getJWT(user.id);
    return { token, user };
  }

  // ! LOGEAR USUARIO POR EMAIL
  async login(loginInput: LoginInput): Promise<AuthResponse> {
    // usando una funcion de un service externo
    const user = await this.usersService.findOneByEmail(loginInput.email);
    // ! VALIDACION DE PASSWORD
    // password de input VS password de DB
    if (!bcrypt.compareSync(loginInput.password, user.password)) {
      throw new BadRequestException('Invalid password...');
    }
    const token = this.getJWT(user.id);
    return { token, user };
  }

  // ! VALIDAR USUARIO
  async validateUser(id: string): Promise<User> {
    const user = await this.usersService.findOneById(id);
    if (!user.isActive) {
      throw new UnauthorizedException(`User of ID ${id} not active...`);
    }
    return user;
  }

  // ! RE VALIDAR TOKEN
  revalidateToken(user: User): AuthResponse {
    const token = this.getJWT(user.id);
    return { token, user };
  }
}
