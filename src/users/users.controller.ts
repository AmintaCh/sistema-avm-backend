import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

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
  async login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }
}
