import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly svc: ProyectosService) {}

  @Get()
  async listar(@Query('estadoId') estadoId?: string) {
    if (typeof estadoId === 'string') {
      const id = parseInt(estadoId, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestException('estadoId inválido');
      }
      return this.svc.listar(id);
    }
    return this.svc.listar();
  }

  @Post()
  async crear(@Body() body: CreateProyectoDto) {
    return this.svc.crear(body);
  }

  @Get(':id')
  async obtener(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.buscarPorProyectoId(proyectoId);
  }

  // Endpoints de proyectos (solo nivel raíz)
}
