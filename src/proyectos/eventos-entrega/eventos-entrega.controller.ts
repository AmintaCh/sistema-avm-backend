import { BadRequestException, Body, Controller, Param, Post, Get, Query } from '@nestjs/common';
import { ProyectosEventosEntregaService } from './eventos-entrega.service';
import { CreateEventoEntregaDto } from '../dto/create-evento-entrega.dto';

@Controller('proyectos/:id/eventos-entrega')
export class ProyectosEventosEntregaController {
  constructor(private readonly svc: ProyectosEventosEntregaService) {}

  @Post()
  async crearEvento(
    @Param('id') idParam: string,
    @Body() body: CreateEventoEntregaDto,
  ) {
    const proyectoId = parseInt(idParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (!body) {
      throw new BadRequestException('Body requerido');
    }
    return this.svc.crearEventoEntrega(proyectoId, body);
  }

  @Get()
  async listar(
    @Param('id') idParam: string,
    @Query('q') q?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const proyectoId = parseInt(idParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarEventos(proyectoId, { q, desde, hasta });
  }
}
