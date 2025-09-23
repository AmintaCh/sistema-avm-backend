import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProyectosAsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from '../dto/create-asistencia.dto';
import { CreateAsistenciasBatchDto } from '../dto/create-asistencias-batch.dto';

@Controller('proyectos/:id/actividades/:actividadId/asistencias')
export class ProyectosAsistenciasController {
  constructor(private readonly svc: ProyectosAsistenciasService) {}

  @Post()
  async crearAsistencia(
    @Param('id') id: string,
    @Param('actividadId') actividadIdParam: string,
    @Body() body: CreateAsistenciaDto,
  ) {
    const proyectoId = parseInt(id, 10);
    const actividadId = parseInt(actividadIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(actividadId)) {
      throw new BadRequestException('actividadId inválido');
    }
    if (!body?.beneficiarioId || !Number.isInteger(Number(body.beneficiarioId))) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    if (!body?.fechaRegistro || !/^\\d{4}-\\d{2}-\\d{2}$/.test(body.fechaRegistro)) {
      throw new BadRequestException('fechaRegistro es requerida (YYYY-MM-DD)');
    }
    if (body?.estadoId === undefined || body?.estadoId === null || !Number.isInteger(Number(body.estadoId))) {
      throw new BadRequestException('estadoId inválido');
    }
    return this.svc.crearAsistencia(proyectoId, actividadId, body);
  }

  @Get()
  async listarAsistencias(@Param('id') id: string, @Param('actividadId') actividadIdParam: string) {
    const proyectoId = parseInt(id, 10);
    const actividadId = parseInt(actividadIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(actividadId)) {
      throw new BadRequestException('actividadId inválido');
    }
    return this.svc.listarAsistenciasDeActividad(proyectoId, actividadId);
  }

  @Post('lote')
  async crearAsistenciasLote(
    @Param('id') id: string,
    @Param('actividadId') actividadIdParam: string,
    @Body() body: CreateAsistenciasBatchDto,
  ) {
    const proyectoId = parseInt(id, 10);
    const actividadId = parseInt(actividadIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(actividadId)) {
      throw new BadRequestException('actividadId inválido');
    }
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('items es requerido y no puede estar vacío');
    }
    return this.svc.crearAsistenciasEnLote(proyectoId, actividadId, body);
  }
}
