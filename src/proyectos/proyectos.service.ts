import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(@InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>) {}

  async listar(estadoId?: number) {
    const qb = this.proyectoRepo
      .createQueryBuilder('p')
      .leftJoin('cat_estados', 'e', "e.estado_id = p.estado_id AND e.tipo_estado = 'P'")
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.descripcion', 'estadoNombre')
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
      .leftJoin('cat_estados', 'e', "e.estado_id = p.estado_id AND e.tipo_estado = 'P'")
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.descripcion', 'estadoNombre')
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
      estado: { estadoId: r.estadoId, descripcion: r.estadoNombre },
    };
  }

  // Métodos de usuarios, beneficiarios, actividades y asistencias se movieron a servicios dedicados

  // Reemplazo completo via PUT
  async reemplazar(proyectoId: number, dto: CreateProyectoDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const proyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    // Validaciones similares a crear
    if (!dto.nombreProyecto || !dto.nombreProyecto.trim()) {
      throw new BadRequestException('nombre_proyecto es requerido');
    }
    if (!dto.fechaInicio) {
      throw new BadRequestException('fecha_inicio es requerido');
    }
    if (dto.estadoId === undefined || dto.estadoId === null) {
      throw new BadRequestException('estado_id es requerido');
    }
    if (dto.fechaFin && dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException('fecha_fin no puede ser anterior a fecha_inicio');
    }

    // Asignación completa (reemplazo)
    proyecto.nombreProyecto = dto.nombreProyecto.trim();
    proyecto.descripcion = dto.descripcion ?? null;
    proyecto.fechaInicio = dto.fechaInicio;
    proyecto.fechaFin = dto.fechaFin ?? null;
    proyecto.estadoId = dto.estadoId;

    const saved = await this.proyectoRepo.save(proyecto);
    return {
      message: `El proyecto '${saved.nombreProyecto}' se actualizó correctamente`,
    };
  }
}
