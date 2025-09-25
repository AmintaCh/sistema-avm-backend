import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Beneficio } from '../../entities/beneficio.entity';
import { BeneficioProyecto } from '../../entities/beneficio-proyecto.entity';

@Injectable()
export class ProyectosBeneficiosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(Beneficio) private readonly beneficioRepo: Repository<Beneficio>,
    @InjectRepository(BeneficioProyecto) private readonly beneficioProyectoRepo: Repository<BeneficioProyecto>,
  ) {}

  async agregarBeneficioAProyecto(proyectoId: number, beneficioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      throw new BadRequestException('beneficioId inválido');
    }

    const [proyecto, beneficio] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.beneficioRepo.findOne({ where: { beneficioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!beneficio) {
      throw new NotFoundException('No se encontró el beneficio indicado');
    }

    const existente = await this.beneficioProyectoRepo.findOne({ where: { proyectoId, beneficioId } });
    if (existente) {
      throw new BadRequestException('El beneficio ya está asignado al proyecto');
    }

    const rel = this.beneficioProyectoRepo.create({ proyecto, beneficio });
    await this.beneficioProyectoRepo.save(rel);
    return { proyectoId, beneficioId, agregado: true };
  }

  async listarBeneficiosDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.beneficioRepo
      .createQueryBuilder('b')
      .innerJoin('beneficios_x_proyecto', 'bx', 'bx.beneficio_id = b.beneficio_id')
      .select('b.beneficio_id', 'beneficioId')
      .addSelect('b.nombre_beneficio', 'nombreBeneficio')
      .addSelect('b.descripcion', 'descripcion')
      .addSelect('b.unidad_medida', 'unidadMedida')
      .where('bx.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('b.nombre_beneficio', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      beneficioId: r.beneficioId,
      nombreBeneficio: r.nombreBeneficio,
      descripcion: r.descripcion,
      unidadMedida: r.unidadMedida,
    }));
  }
}
