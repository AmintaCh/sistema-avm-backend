import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Usuario } from '../../entities/usuario.entity';
import { EventoEntrega } from '../../entities/evento-entrega.entity';
import { CreateEventoEntregaDto } from '../dto/create-evento-entrega.dto';

@Injectable()
export class ProyectosEventosEntregaService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(EventoEntrega) private readonly eventoRepo: Repository<EventoEntrega>,
  ) {}

  async crearEventoEntrega(proyectoId: number, dto: CreateEventoEntregaDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Body inválido');
    }

    const nombre = dto.nombre?.trim();
    if (!nombre) {
      throw new BadRequestException('nombre es requerido');
    }
    if (nombre.length > 150) {
      throw new BadRequestException('nombre excede 150 caracteres');
    }

    const fechaRaw = dto.fechaEvento;
    if (typeof fechaRaw !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(fechaRaw)) {
      throw new BadRequestException('fechaEvento debe tener formato YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss');
    }
    const fechaEvento = fechaRaw.split('T')[0];

    const lugar = dto.lugar == null ? null : dto.lugar.toString().trim();
    if (lugar && lugar.length > 150) {
      throw new BadRequestException('lugar excede 150 caracteres');
    }

    const observaciones = dto.observaciones == null ? null : dto.observaciones.toString().trim() || null;

    const createdBy = Number(dto.createdBy);
    if (!Number.isInteger(createdBy) || createdBy <= 0) {
      throw new BadRequestException('createdBy inválido');
    }

    const [proyecto, creador] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.usuarioRepo.findOne({ where: { usuarioId: createdBy } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!creador) {
      throw new NotFoundException('No se encontró el usuario creador indicado');
    }

    const entity = this.eventoRepo.create({
      nombre,
      fechaEvento,
      proyecto,
      lugar,
      observaciones,
      creadoPor: creador,
      creadoEn: new Date(),
    });

    const saved = await this.eventoRepo.save(entity);

    return {
      eventoId: saved.eventoId,
      nombre: saved.nombre,
      fechaEvento: saved.fechaEvento,
      proyectoId: proyecto.proyectoId,
      lugar: saved.lugar ?? null,
      observaciones: saved.observaciones ?? null,
      createdBy: creador.usuarioId,
      createdAt: saved.creadoEn,
    };
  }

  async listarEventos(
    proyectoId: number,
    filtros?: { q?: string; desde?: string; hasta?: string; eventoId?: number },
  ) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const qb = this.eventoRepo
      .createQueryBuilder('ev')
      .where('ev.proyecto_id = :proyectoId', { proyectoId })
      .select('ev.evento_id', 'eventoId')
      .addSelect('ev.nombre', 'nombre')
      .addSelect('ev.fecha_evento', 'fechaEvento')
      .addSelect('ev.proyecto_id', 'proyectoId')
      .addSelect('ev.lugar', 'lugar')
      .addSelect('ev.observaciones', 'observaciones')
      .orderBy('ev.fecha_evento', 'DESC')
      .addOrderBy('ev.evento_id', 'DESC');

    const q = (filtros?.q ?? '').trim();
    if (q) {
      qb.andWhere('ev.nombre LIKE :q', { q: `%${q}%` });
    }

    if (filtros?.eventoId != null) {
      if (!Number.isInteger(filtros.eventoId) || filtros.eventoId <= 0) {
        throw new BadRequestException('eventoId inválido');
      }
      qb.andWhere('ev.evento_id = :eventoId', { eventoId: filtros.eventoId });
    }

    const dateOrIsoRe = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
    if (filtros?.desde) {
      if (typeof filtros.desde !== 'string' || !dateOrIsoRe.test(filtros.desde)) {
        throw new BadRequestException('desde debe tener formato YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss');
      }
      qb.andWhere('ev.fecha_evento >= :desde', { desde: filtros.desde.split('T')[0] });
    }
    if (filtros?.hasta) {
      if (typeof filtros.hasta !== 'string' || !dateOrIsoRe.test(filtros.hasta)) {
        throw new BadRequestException('hasta debe tener formato YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss');
      }
      qb.andWhere('ev.fecha_evento <= :hasta', { hasta: filtros.hasta.split('T')[0] });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      eventoId: Number(r.eventoId),
      nombre: r.nombre,
      fechaEvento: r.fechaEvento,
      proyectoId: Number(r.proyectoId),
      lugar: r.lugar ?? null,
      observaciones: r.observaciones ?? null,
    }));
  }
}
