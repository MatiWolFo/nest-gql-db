import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { SignUpInput } from 'src/auth/dto/inputs/signup-input';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  // inyectando un Logger para revisar errores ocurridos EN ESTE SERVICIO
  private logger: Logger = new Logger('UsersService');

  // creando el repo constructor para dar a la db usando TYPEORM
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  // ! CREAR UN NUEVO USUARIO
  // heredando input desde otro modulo
  async create(signUpInput: SignUpInput): Promise<User> {
    try {
      // mandando la info del input
      const newUser = this.usersRepository.create({
        // usando el encrypt de passwords
        ...signUpInput,
        password: bcrypt.hashSync(signUpInput.password, 10),
      });
      // esperando que guarde el usuario creado en la linea anterior
      return await this.usersRepository.save(newUser);
    } catch (error) {
      // llamando el logger de errores private
      this.handleDBErrors(error);
    }
  }

  // argumentos agregados para realizar un filtro o validacion
  async findAll(roles: ValidRoles[]): Promise<User[]> {
    // va a consultar al userRepository, regresa todos si no se envia nada
    if (roles.length === 0) {
      return await this.usersRepository.find();
    }
    // cuando hay roles, queryBuilder, el getMany es el resultado del queryBuilder
    return await this.usersRepository
      .createQueryBuilder()
      // ! AGREGANDO METODO PROPIO POSTGRES
      // la tabla en la DB tiene que hacer match con al menos uno de los enviados por parametro
      .andWhere('ARRAY[roles] && ARRAY[:...roles]')
      // establecer dichos parametros
      .setParameter('roles', roles)
      .getMany();
  }

  async findOne(id: string): Promise<User> {
    throw new NotFoundException(`Item of ID #${id} not found`);
  }

  // ! ENCONTRAR USUARIO POR EMAIL
  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ email });
    } catch (error) {
      throw new NotFoundException(`Email: ${email} not found in DB...`);
      // implementando un error personalizado
      // this.handleDBErrors({
      //   code: 'ERROR-001',
      //   detail: `Email: ${email} not found in DB...`,
      // });
    }
  }

  // ! ENCONTRAR USUARIO POR ID
  async findOneById(id: string): Promise<User> {
    try {
      return await this.usersRepository.findOneByOrFail({ id });
    } catch (error) {
      throw new NotFoundException(`ID: ${id} not found in DB...`);
    }
  }

  async updateUserById(
    id: string,
    updateUserInput: UpdateUserInput,
    adminUser: User,
  ): Promise<User> {
    try {
      const userToUpdate = await this.usersRepository.preload({
        ...updateUserInput,
        id,
      });
      userToUpdate.updatedBy = adminUser;
      return await this.usersRepository.save(userToUpdate);
    } catch (error) {
      this.handleDBErrors(error);
    };
  }

  //! BLOQUEAR USUARIO STATUS TRUE A FALSE POR ID
  async block(id: string, adminUser: User): Promise<User> {
    // buscar el ID en db
    const userToBlock = await this.findOneById(id);
    if (!userToBlock) {
      throw new NotFoundException(`User of ID #${id} not found`);
    }
    userToBlock.isActive = false;
    userToBlock.updatedBy = adminUser;
    return await this.usersRepository.save(userToBlock);
  }

  // ! BLOQUE DE ERRORES
  // metodo que jamas devuelve un valor, para manejo de errores
  private handleDBErrors(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail.replace('Key', ''));
    }
    // implementando error personalizado desde otra funcion
    if (error.code === 'ERROR-001') {
      throw new BadRequestException(error.detail.replace('Key', ''));
    }
    // implementado logger de errores
    this.logger.error(error);
    // mandando mensaje de cualquier otro error
    throw new InternalServerErrorException('Check servers logger');
  }
}
