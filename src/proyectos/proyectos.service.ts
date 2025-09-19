import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(UsuarioProyecto) private readonly usuarioProyectoRepo: Repository<UsuarioProyecto>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async listar(estadoId?: number) {
    const qb = this.proyectoRepo
      .createQueryBuilder('p')
      .leftJoin('cat_estados', 'e', 'e.estado_id = p.estado_id')
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.nombre', 'estadoNombre')
      .orderBy('p.nombre_proyecto', 'ASC');

    if (typeof estadoId === 'number') {
      qb.where('p.estado_id = :estadoId', { estadoId });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      proyectoId: r.proyectoId,
      nombreProyecto: r.nombreProyecto,
      descripcion: r.descripcion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: { estadoId: r.estadoId, nombre: r.estadoNombre },
    }));
  }

  async crear(dto: CreateProyectoDto) {
    if (!dto.nombreProyecto || !dto.nombreProyecto.trim()) {
      throw new BadRequestException('nombre_proyecto es requerido');
    }
    if (!dto.fechaInicio) {
      throw new BadRequestException('fecha_inicio es requerido');
    }
    // estado_id es requerido por la BD
    if (dto.estadoId === undefined || dto.estadoId === null) {
      throw new BadRequestException('estado_id es requerido');
    }

    // Validación simple de fechas (opcional, no bloqueante si formato inválido)
    if (dto.fechaFin && dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException('fecha_fin no puede ser anterior a fecha_inicio');
    }

    const entity = this.proyectoRepo.create({
      nombreProyecto: dto.nombreProyecto.trim(),
      descripcion: dto.descripcion ?? null,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin ?? null,
      estadoId: dto.estadoId,
    });

    const saved = await this.proyectoRepo.save(entity);
    return {
      proyectoId: saved.proyectoId,
      nombreProyecto: saved.nombreProyecto,
      descripcion: saved.descripcion ?? null,
      fechaInicio: saved.fechaInicio,
      fechaFin: saved.fechaFin ?? null,
      estadoId: saved.estadoId,
    };
  }

  async buscarPorProyectoId(proyectoId: number) {
    const qb = this.proyectoRepo
      .createQueryBuilder('p')
      .leftJoin('cat_estados', 'e', 'e.estado_id = p.estado_id')
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.nombre', 'estadoNombre')
      .where('p.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('p.proyecto_id', 'DESC');

    const r = await qb.getRawOne();
    if (!r) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    return {
      proyectoId: r.proyectoId,
      nombreProyecto: r.nombreProyecto,
      descripcion: r.descripcion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: { estadoId: r.estadoId, nombre: r.estadoNombre },
    };
  }

  async agregarUsuarioAProyecto(proyectoId: number, usuarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    // Verificar existencia de proyecto y usuario
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

    // Verificar si ya existe la relación
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

    // Verificar existencia de proyecto (opcional, pero útil para 404 coherente)
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
