import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(@InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>) {}

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
}
