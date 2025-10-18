import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficio } from '../entities/beneficio.entity';
import { CreateBeneficioDto } from './dto/create-beneficio.dto';

@Injectable()
export class BeneficiosService {
  constructor(@InjectRepository(Beneficio) private readonly beneficioRepo: Repository<Beneficio>) {}

  async listar(filters?: { q?: string; nombre?: string; proyectoId?: number }) {
    const qb = this.beneficioRepo
      .createQueryBuilder('b')
      .select('b.beneficio_id', 'beneficioId')
      .addSelect('b.nombre_beneficio', 'nombreBeneficio')
      .addSelect('b.descripcion', 'descripcion')
      .addSelect('b.unidad_medida', 'unidadMedida')
      .orderBy('b.nombre_beneficio', 'ASC');

    const search = (filters?.q ?? filters?.nombre ?? '').trim();
    if (search) {
      qb.where('b.nombre_beneficio LIKE :search', { search: `%${search}%` });
    }

    if (filters?.proyectoId && Number.isInteger(filters.proyectoId) && filters.proyectoId > 0) {
      // Si ya hay condiciones previas (por q/nombre), mantenerlas con AND
      qb.innerJoin('beneficios_x_proyecto', 'bx', 'bx.beneficio_id = b.beneficio_id')
        .andWhere('bx.proyecto_id = :proyectoId', { proyectoId: filters.proyectoId });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      beneficioId: r.beneficioId,
      nombreBeneficio: r.nombreBeneficio,
      descripcion: r.descripcion,
      unidadMedida: r.unidadMedida,
    }));
  }

  async buscarPorId(beneficioId: number) {
    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      throw new BadRequestException('beneficioId inválido');
    }
    const r = await this.beneficioRepo
      .createQueryBuilder('b')
      .select('b.beneficio_id', 'beneficioId')
      .addSelect('b.nombre_beneficio', 'nombreBeneficio')
      .addSelect('b.descripcion', 'descripcion')
      .addSelect('b.unidad_medida', 'unidadMedida')
      .where('b.beneficio_id = :beneficioId', { beneficioId })
      .getRawOne();
    if (!r) {
      throw new NotFoundException('No se encontró el beneficio indicado');
    }
    return {
      beneficioId: r.beneficioId,
      nombreBeneficio: r.nombreBeneficio,
      descripcion: r.descripcion,
      unidadMedida: r.unidadMedida,
    };
  }

  private validarDto(dto: CreateBeneficioDto) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Body inválido');
    }
    if (!dto.nombreBeneficio || !dto.nombreBeneficio.trim()) {
      throw new BadRequestException('nombreBeneficio es requerido');
    }
    if (dto.nombreBeneficio.length > 100) {
      throw new BadRequestException('nombreBeneficio excede 100 caracteres');
    }
    if (!dto.unidadMedida || !dto.unidadMedida.trim()) {
      throw new BadRequestException('unidadMedida es requerido');
    }
    if (dto.unidadMedida.length > 50) {
      throw new BadRequestException('unidadMedida excede 50 caracteres');
    }
    if (dto.descripcion != null && typeof dto.descripcion !== 'string') {
      throw new BadRequestException('descripcion debe ser string');
    }
  }

  async crear(dto: CreateBeneficioDto) {
    this.validarDto(dto);
    const entity = this.beneficioRepo.create({
      nombreBeneficio: dto.nombreBeneficio.trim(),
      descripcion: dto.descripcion?.trim() || null,
      unidadMedida: dto.unidadMedida.trim(),
    });
    const saved = await this.beneficioRepo.save(entity);
    return {
      beneficioId: saved.beneficioId,
      nombreBeneficio: saved.nombreBeneficio,
      descripcion: saved.descripcion ?? null,
      unidadMedida: saved.unidadMedida,
    };
  }

  async reemplazar(beneficioId: number, dto: CreateBeneficioDto) {
    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      throw new BadRequestException('beneficioId inválido');
    }
    this.validarDto(dto);

    const entity = await this.beneficioRepo.findOne({ where: { beneficioId } });
    if (!entity) {
      throw new NotFoundException('No se encontró el beneficio indicado');
    }

    entity.nombreBeneficio = dto.nombreBeneficio.trim();
    entity.descripcion = dto.descripcion?.trim() || null;
    entity.unidadMedida = dto.unidadMedida.trim();
    const saved = await this.beneficioRepo.save(entity);
    return {
      beneficioId: saved.beneficioId,
      nombreBeneficio: saved.nombreBeneficio,
      descripcion: saved.descripcion ?? null,
      unidadMedida: saved.unidadMedida,
    };
  }

  async eliminar(beneficioId: number) {
    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      throw new BadRequestException('beneficioId inválido');
    }
    const found = await this.beneficioRepo.findOne({ where: { beneficioId } });
    if (!found) {
      throw new NotFoundException('No se encontró el beneficio indicado');
    }
    await this.beneficioRepo.remove(found);
    return { message: 'Beneficio eliminado' };
  }
}
