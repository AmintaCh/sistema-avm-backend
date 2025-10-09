import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../auth/public.decorator';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UpdateUserRolDto } from './dto/update-user-rol.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.usersService.registrar(body);
  }

  @Get()
  async list() {
    return this.usersService.listar();
  }

  @Post('login')
  @Public()
  async login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Get(':usuarioId/proyectos')
  async proyectosDeUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.usersService.obtenerResumenProyectosUsuario(usuarioId);
  }

  @Put(':usuarioId/settings')
  async actualizarSettings(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() body: UserSettingsDto,
  ) {
    return this.usersService.actualizarSettings(usuarioId, body);
  }

  @Get(':usuarioId/settings')
  async obtenerSettings(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.usersService.obtenerSettings(usuarioId);
  }

  @Put(':usuarioId/rol')
  async actualizarRol(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() body: UpdateUserRolDto,
  ) {
    return this.usersService.actualizarRol(usuarioId, body);
  }
}
