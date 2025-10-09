import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'vw_distribucion_beneficiarios_genero', expression: `SELECT 1` })
export class DistribucionBeneficiariosGeneroView {
  @ViewColumn()
  genero_desc!: string;

  @ViewColumn()
  total_beneficiarios!: number;

  @ViewColumn()
  porcentaje!: number;
}

