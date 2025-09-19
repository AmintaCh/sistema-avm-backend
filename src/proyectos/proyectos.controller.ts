import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { AddUsuarioProyectoDto } from './dto/add-usuario-proyecto.dto';

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
}
