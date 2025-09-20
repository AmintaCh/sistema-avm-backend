import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { AddUsuarioProyectoDto } from './dto/add-usuario-proyecto.dto';
import { AddBeneficiarioProyectoDto } from './dto/add-beneficiario-proyecto.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { CreateAsistenciasBatchDto } from './dto/create-asistencias-batch.dto';

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

  @Post(':id/usuarios')
  async agregarUsuario(
    @Param('id') id: string,
    @Body() body: AddUsuarioProyectoDto,
  ) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (body?.usuarioId === undefined || body?.usuarioId === null) {
      throw new BadRequestException('usuarioId es requerido');
    }
    const usuarioId = Number(body.usuarioId);
    if (!Number.isInteger(usuarioId)) {
      throw new BadRequestException('usuarioId inválido');
    }
    return this.svc.agregarUsuarioAProyecto(proyectoId, usuarioId);
  }

  @Get(':id/usuarios')
  async listarUsuarios(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarUsuariosDeProyecto(proyectoId);
  }

  @Delete(':id/usuarios/:usuarioId')
  async eliminarUsuario(@Param('id') id: string, @Param('usuarioId') usuarioIdParam: string) {
    const proyectoId = parseInt(id, 10);
    const usuarioId = parseInt(usuarioIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(usuarioId)) {
      throw new BadRequestException('usuarioId inválido');
    }
    return this.svc.eliminarUsuarioDeProyecto(proyectoId, usuarioId);
  }

  @Post(':id/beneficiarios')
  async agregarBeneficiario(
    @Param('id') id: string,
    @Body() body: AddBeneficiarioProyectoDto,
  ) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }

    const beneficiarioId = Number(body?.beneficiarioId);
    if (!Number.isInteger(beneficiarioId)) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    const fechaIncorporacion = body?.fechaIncorporacion;
    if (typeof fechaIncorporacion !== 'string' || !fechaIncorporacion) {
      throw new BadRequestException('fechaIncorporacion es requerida');
    }
    const estadoId = Number(body?.estadoId);
    if (!Number.isInteger(estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    return this.svc.agregarBeneficiarioAProyecto({ proyectoId, beneficiarioId, fechaIncorporacion, estadoId });
  }

  @Get(':id/beneficiarios')
  async listarBeneficiarios(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarBeneficiariosDeProyecto(proyectoId);
  }

  @Delete(':id/beneficiarios/:beneficiarioId')
  async eliminarBeneficiario(
    @Param('id') id: string,
    @Param('beneficiarioId') beneficiarioIdParam: string,
  ) {
    const proyectoId = parseInt(id, 10);
    const beneficiarioId = parseInt(beneficiarioIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(beneficiarioId)) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    return this.svc.eliminarBeneficiarioDeProyecto(proyectoId, beneficiarioId);
  }

  @Post(':id/actividades')
  async crearActividad(
    @Param('id') id: string,
    @Body() body: CreateActividadDto,
  ) {
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

  @Get(':id/actividades')
  async listarActividades(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarActividadesDeProyecto(proyectoId);
  }

  @Get(':id/actividades/:actividadId')
  async obtenerActividad(
    @Param('id') id: string,
    @Param('actividadId') actividadIdParam: string,
  ) {
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

  @Post(':id/actividades/:actividadId/asistencias')
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
    if (!body?.fechaRegistro || !/^\d{4}-\d{2}-\d{2}$/.test(body.fechaRegistro)) {
      throw new BadRequestException('fechaRegistro es requerida (YYYY-MM-DD)');
    }
    if (body?.estadoId === undefined || body?.estadoId === null || !Number.isInteger(Number(body.estadoId))) {
      throw new BadRequestException('estadoId inválido');
    }
    return this.svc.crearAsistencia(proyectoId, actividadId, body);
  }

  @Get(':id/actividades/:actividadId/asistencias')
  async listarAsistencias(
    @Param('id') id: string,
    @Param('actividadId') actividadIdParam: string,
  ) {
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

  @Post(':id/actividades/:actividadId/asistencias/lote')
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
