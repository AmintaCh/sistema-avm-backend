import { Body, Controller, Post } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly svc: ProyectosService) {}

  @Post()
  async crear(@Body() body: CreateProyectoDto) {
    return this.svc.crear(body);
  }
}

