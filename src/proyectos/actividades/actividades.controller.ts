import { BadRequestException, Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProyectosActividadesService } from './actividades.service';
import { CreateActividadDto } from '../dto/create-actividad.dto';

@Controller('proyectos/:id/actividades')
export class ProyectosActividadesController {
  constructor(private readonly svc: ProyectosActividadesService) {}

  @Post()
  async crearActividad(@Param('id') id: string, @Body() body: CreateActividadDto) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (!body?.nombreActividad || !body.nombreActividad.trim()) {
      throw new BadRequestException('nombreActividad es requerido');
    }
    if (!body?.tipoActividad || !body.tipoActividad.trim()) {
      throw new BadRequestException('tipoActividad es requerido');
    }
    if (!body?.fechaActividad || !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaActividad)) {
      throw new BadRequestException('fechaActividad es requerida (YYYY-MM-DD)');
    }
    return this.svc.crearActividad(proyectoId, body);
  }

  @Get()
  async listarActividades(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarActividadesDeProyecto(proyectoId);
  }

  @Get(':actividadId')
  async obtenerActividad(@Param('id') id: string, @Param('actividadId') actividadIdParam: string) {
    const proyectoId = parseInt(id, 10);
    const actividadId = parseInt(actividadIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(actividadId)) {
      throw new BadRequestException('actividadId inválido');
    }
    return this.svc.obtenerActividadPorId(proyectoId, actividadId);
  }

  @Put(':actividadId')
  async reemplazarActividad(
    @Param('id') id: string,
    @Param('actividadId') actividadIdParam: string,
    @Body() body: CreateActividadDto,
  ) {
    const proyectoId = parseInt(id, 10);
    const actividadId = parseInt(actividadIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(actividadId)) {
      throw new BadRequestException('actividadId inválido');
    }
    if (!body?.nombreActividad || !body.nombreActividad.trim()) {
      throw new BadRequestException('nombreActividad es requerido');
    }
    if (!body?.tipoActividad || !body.tipoActividad.trim()) {
      throw new BadRequestException('tipoActividad es requerido');
    }
    if (!body?.fechaActividad || !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaActividad)) {
      throw new BadRequestException('fechaActividad es requerida (YYYY-MM-DD)');
    }
    return this.svc.reemplazarActividad(proyectoId, actividadId, body);
  }
}
