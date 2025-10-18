import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiariosActivosPorProyectoView } from '../reporting/entities/vw-beneficiarios-activos-por-proyecto.view';

@Injectable()
export class BeneficiariosActivosPorProyectoService {
  constructor(
    @InjectRepository(BeneficiariosActivosPorProyectoView)
    private readonly viewRepo: Repository<BeneficiariosActivosPorProyectoView>,
  ) {}

  async listar() {
    const rows = await this.viewRepo
      .createQueryBuilder('v')
      .orderBy('v.total_beneficiarios_activos', 'DESC')
      .addOrderBy('v.proyecto', 'ASC')
      .getMany();
    return rows.map((r) => ({
      proyectoId: r.proyecto_id,
      proyecto: r.proyecto,
      totalBeneficiariosActivos: Number(r.total_beneficiarios_activos),
    }));
  }
}

