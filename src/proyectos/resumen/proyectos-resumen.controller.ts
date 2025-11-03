import { Controller, Get, Param } from '@nestjs/common';
import { ProyectosResumenService } from './proyectos-resumen.service';

@Controller('proyectos/resumen')
export class ProyectosResumenController {
  constructor(private readonly service: ProyectosResumenService) {}

  @Get()
  async listar() {
    return this.service.listar();
  }

  @Get(':proyectoId')
  async obtener(@Param('proyectoId') proyectoId: string) {
    const id = Number(proyectoId);
    return this.service.obtener(id);
  }
}

