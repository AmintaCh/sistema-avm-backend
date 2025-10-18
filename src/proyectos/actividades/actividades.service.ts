import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Actividad } from '../../entities/actividad.entity';
import { CreateActividadDto } from '../dto/create-actividad.dto';

@Injectable()
export class ProyectosActividadesService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(Actividad) private readonly actividadRepo: Repository<Actividad>,
  ) {}

  async crearActividad(proyectoId: number, dto: CreateActividadDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    const proyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!dto.nombreActividad?.trim()) {
      throw new BadRequestException('nombreActividad es requerido');
    }
    if (!dto.tipoActividad?.trim()) {
      throw new BadRequestException('tipoActividad es requerido');
    }
    if (!dto.fechaActividad || !/^\d{4}-\d{2}-\d{2}$/.test(dto.fechaActividad)) {
      throw new BadRequestException('fechaActividad debe tener formato YYYY-MM-DD');
    }
    const entity = this.actividadRepo.create({
      proyecto,
      nombreActividad: dto.nombreActividad.trim(),
      tipoActividad: dto.tipoActividad.trim(),
      descripcion: dto.descripcion ?? null,
      fechaActividad: dto.fechaActividad,
      lugar: dto.lugar?.trim() ?? null,
    });
    const saved = await this.actividadRepo.save(entity);
    return {
      actividadId: saved.actividadId,
      proyectoId: proyecto.proyectoId,
      nombreActividad: saved.nombreActividad,
      tipoActividad: saved.tipoActividad,
      descripcion: saved.descripcion ?? null,
      fechaActividad: saved.fechaActividad,
      lugar: saved.lugar,
    };
  }

  async listarActividadesDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.actividadRepo
      .createQueryBuilder('a')
      .select('a.actividad_id', 'actividadId')
      .addSelect('a.proyecto_id', 'proyectoId')
      .addSelect('a.nombre_actividad', 'nombreActividad')
      .addSelect('a.tipo_actividad', 'tipoActividad')
      .addSelect('a.descripcion', 'descripcion')
      .addSelect('a.fecha_actividad', 'fechaActividad')
      .addSelect('a.lugar', 'lugar')
      .where('a.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('a.fecha_actividad', 'DESC')
      .addOrderBy('a.actividad_id', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      actividadId: r.actividadId,
      proyectoId: r.proyectoId,
      nombreActividad: r.nombreActividad,
      tipoActividad: r.tipoActividad,
      descripcion: r.descripcion,
      fechaActividad: r.fechaActividad,
      lugar: r.lugar,
    }));
  }

  async obtenerActividadPorId(proyectoId: number, actividadId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }

    const row = await this.actividadRepo
      .createQueryBuilder('a')
      .select('a.actividad_id', 'actividadId')
      .addSelect('a.proyecto_id', 'proyectoId')
      .addSelect('a.nombre_actividad', 'nombreActividad')
      .addSelect('a.tipo_actividad', 'tipoActividad')
      .addSelect('a.descripcion', 'descripcion')
      .addSelect('a.fecha_actividad', 'fechaActividad')
      .addSelect('a.lugar', 'lugar')
      .where('a.actividad_id = :actividadId AND a.proyecto_id = :proyectoId', { actividadId, proyectoId })
      .getRawOne();

    if (!row) {
      throw new NotFoundException('No se encontró la actividad para el proyecto indicado');
    }

    return {
      actividadId: row.actividadId,
      proyectoId: row.proyectoId,
      nombreActividad: row.nombreActividad,
      tipoActividad: row.tipoActividad,
      descripcion: row.descripcion,
      fechaActividad: row.fechaActividad,
      lugar: row.lugar,
    };
  }

  async reemplazarActividad(proyectoId: number, actividadId: number, dto: CreateActividadDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }

    const proyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const actividad = await this.actividadRepo.findOne({ where: { actividadId }, relations: ['proyecto'] });
    if (!actividad || actividad.proyecto.proyectoId !== proyectoId) {
      throw new NotFoundException('No se encontró la actividad para el proyecto indicado');
    }

    if (!dto.nombreActividad?.trim()) {
      throw new BadRequestException('nombreActividad es requerido');
    }
    if (!dto.tipoActividad?.trim()) {
      throw new BadRequestException('tipoActividad es requerido');
    }
    if (!dto.fechaActividad || !/^\d{4}-\d{2}-\d{2}$/.test(dto.fechaActividad)) {
      throw new BadRequestException('fechaActividad debe tener formato YYYY-MM-DD');
    }

    // Reemplazo completo de campos modificables
    actividad.nombreActividad = dto.nombreActividad.trim();
    actividad.tipoActividad = dto.tipoActividad.trim();
    actividad.descripcion = dto.descripcion ?? null;
    actividad.fechaActividad = dto.fechaActividad;
    actividad.lugar = dto.lugar?.trim() ?? null;

    const saved = await this.actividadRepo.save(actividad);
    return { message: `La actividad '${saved.nombreActividad}' se actualizó correctamente` };
  }
}
