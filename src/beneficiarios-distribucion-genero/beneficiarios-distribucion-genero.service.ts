import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistribucionBeneficiariosGeneroView } from '../reporting/entities/vw-distribucion-beneficiarios-genero.view';

@Injectable()
export class BeneficiariosDistribucionGeneroService {
  constructor(
    @InjectRepository(DistribucionBeneficiariosGeneroView)
    private readonly viewRepo: Repository<DistribucionBeneficiariosGeneroView>,
  ) {}

  async listar() {
    const rows = await this.viewRepo.createQueryBuilder('v').orderBy('v.total_beneficiarios', 'DESC').getMany();
    return rows.map((r) => ({
      generoDesc: r.genero_desc,
      totalBeneficiarios: Number(r.total_beneficiarios),
      porcentaje: Number(r.porcentaje),
    }));
  }
}

