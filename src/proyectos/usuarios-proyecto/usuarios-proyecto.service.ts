import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { UsuarioProyecto } from '../../entities/usuario-proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';

@Injectable()
export class ProyectosUsuariosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(UsuarioProyecto) private readonly usuarioProyectoRepo: Repository<UsuarioProyecto>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async agregarUsuarioAProyecto(proyectoId: number, usuarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const [proyecto, usuario] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.usuarioRepo.findOne({ where: { usuarioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    const existente = await this.usuarioProyectoRepo
      .createQueryBuilder('up')
      .where('up.usuario_id = :usuarioId AND up.proyecto_id = :proyectoId', { usuarioId, proyectoId })
      .getOne();
    if (existente) {
      throw new BadRequestException('El usuario ya está asignado al proyecto');
    }

    const rel = this.usuarioProyectoRepo.create({ proyecto, usuario });
    await this.usuarioProyectoRepo.save(rel);
    return { proyectoId, usuarioId };
  }

  async listarUsuariosDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('usuarios_x_proyecto', 'up', 'up.usuario_id = u.usuario_id')
      .leftJoin('persona', 'p', 'p.persona_id = u.persona_id')
      .select('u.usuario_id', 'usuarioId')
      .addSelect('u.nombre_usuario', 'nombreUsuario')
      .addSelect('u.correo_electronico', 'correoElectronico')
      .addSelect('u.estado_id', 'estadoId')
      .addSelect('p.persona_id', 'personaId')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
      .where('up.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('u.nombre_usuario', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      usuarioId: r.usuarioId,
      nombreUsuario: r.nombreUsuario,
      correoElectronico: r.correoElectronico,
      estadoId: r.estadoId,
      persona: r.personaId
        ? { personaId: r.personaId, primerNombre: r.primerNombre, primerApellido: r.primerApellido }
        : null,
    }));
  }

  async eliminarUsuarioDeProyecto(proyectoId: number, usuarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const result = await this.usuarioProyectoRepo.delete({ proyectoId, usuarioId });
    if (!result.affected) {
      throw new NotFoundException('El usuario no está asignado al proyecto');
    }
    return { proyectoId, usuarioId, eliminado: true };
  }
}
