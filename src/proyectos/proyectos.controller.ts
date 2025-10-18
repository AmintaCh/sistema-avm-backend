import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly svc: ProyectosService) {}

  @Get()
  async listar(@Query('estadoId') estadoId?: string, @Query('usuarioId') usuarioId?: string) {
    const filters: { estadoId?: number; usuarioId?: number } = {};

    if (typeof estadoId === 'string' && estadoId !== '') {
      const id = parseInt(estadoId, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestException('estadoId inválido');
      }
      filters.estadoId = id;
    }

    if (typeof usuarioId === 'string' && usuarioId !== '') {
      const uid = parseInt(usuarioId, 10);
      if (Number.isNaN(uid)) {
        throw new BadRequestException('usuarioId inválido');
      }
      filters.usuarioId = uid;
    }

    return this.svc.listar(filters);
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

  @Put(':id')
  async reemplazar(@Param('id') id: string, @Body() body: CreateProyectoDto) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.reemplazar(proyectoId, body);
  }

  // Endpoints de proyectos (solo nivel raíz)
}
