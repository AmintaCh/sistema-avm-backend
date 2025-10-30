import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { BeneficiarioProyecto } from '../../entities/beneficiario-proyecto.entity';
import { Beneficiario } from '../../entities/beneficiario.entity';

@Injectable()
export class ProyectosBeneficiariosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(BeneficiarioProyecto) private readonly benefProyectoRepo: Repository<BeneficiarioProyecto>,
    @InjectRepository(Beneficiario) private readonly beneficiarioRepo: Repository<Beneficiario>,
  ) {}

  async agregarBeneficiarioAProyecto(params: {
    proyectoId: number;
    beneficiarioId: number;
    fechaIncorporacion: string; // YYYY-MM-DD
    estadoId: number;
  }) {
    const { proyectoId, beneficiarioId, fechaIncorporacion, estadoId } = params;
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    if (typeof fechaIncorporacion !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaIncorporacion)) {
      throw new BadRequestException('fechaIncorporacion debe tener formato YYYY-MM-DD');
    }
    if (!Number.isInteger(estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    const [proyecto, beneficiario] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.beneficiarioRepo.findOne({ where: { beneficiarioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!beneficiario) {
      throw new NotFoundException('No se encontró el beneficiario indicado');
    }

    const existente = await this.benefProyectoRepo.findOne({ where: { proyectoId, beneficiarioId } });
    if (existente) {
      throw new BadRequestException('El beneficiario ya está asignado al proyecto');
    }

    const rel = this.benefProyectoRepo.create({ proyecto, beneficiario, fechaIncorporacion, estadoId });
    await this.benefProyectoRepo.save(rel);
    return { proyectoId, beneficiarioId, fechaIncorporacion, estadoId };
  }

  async listarBeneficiariosDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.beneficiarioRepo
      .createQueryBuilder('b')
      .innerJoin('beneficiario_proyecto', 'bp', 'bp.beneficiario_id = b.beneficiario_id')
      .leftJoin('persona', 'p', 'p.persona_id = b.persona_id')
      .select('b.beneficiario_id', 'beneficiarioId')
      .addSelect('b.estado_id', 'beneficiarioEstadoId')
      .addSelect('p.persona_id', 'personaId')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.segundo_nombre', 'segundoNombre')
      .addSelect('p.tercer_nombre', 'tercerNomber')
      .addSelect('p.primer_apellido', 'primerApellido')
      .addSelect('p.segundo_apellido', 'segundoApellido')
      .addSelect('bp.fecha_incorporacion', 'fechaIncorporacion')
      .addSelect('bp.estado_id', 'estadoId')
      .where('bp.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('p.primer_nombre', 'ASC')
      .addOrderBy('p.primer_apellido', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      beneficiarioId: r.beneficiarioId,
      beneficiarioEstadoId: r.beneficiarioEstadoId,
      persona: r.personaId
        ? { personaId: r.personaId,
          primerNombre: r.primerNombre,
          segundoNombre:r.segundoNombre,
          tercerNomber:r.tercerNomber,
          primerApellido: r.primerApellido,
          segundoApellido: r.segundoApellido
        }
        : null,
      fechaIncorporacion: r.fechaIncorporacion,
      estadoId: r.estadoId,
    }));
  }

  async eliminarBeneficiarioDeProyecto(proyectoId: number, beneficiarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      throw new BadRequestException('beneficiarioId inválido');
    }

    const result = await this.benefProyectoRepo.delete({ proyectoId, beneficiarioId });
    if (!result.affected) {
      throw new NotFoundException('El beneficiario no está asignado al proyecto');
    }
    return { proyectoId, beneficiarioId, eliminado: true };
  }
}
