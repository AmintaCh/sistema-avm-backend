import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ProyectosUsuariosService } from './usuarios-proyecto.service';
import { AddUsuarioProyectoDto } from '../dto/add-usuario-proyecto.dto';

@Controller('proyectos/:id/usuarios')
export class ProyectosUsuariosController {
  constructor(private readonly svc: ProyectosUsuariosService) {}

  @Post()
  async agregarUsuario(@Param('id') id: string, @Body() body: AddUsuarioProyectoDto) {
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

  @Get()
  async listarUsuarios(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarUsuariosDeProyecto(proyectoId);
  }

  @Delete(':usuarioId')
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
}
