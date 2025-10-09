import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'vw_beneficiarios_activos_por_proyecto', expression: `SELECT 1` })
export class BeneficiariosActivosPorProyectoView {
  @ViewColumn()
  proyecto_id!: number;

  @ViewColumn()
  proyecto!: string;

  @ViewColumn()
  total_beneficiarios_activos!: number;
}

