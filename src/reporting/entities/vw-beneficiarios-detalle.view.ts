import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({ name: 'vw_beneficiarios_detalle', expression: `SELECT 1` })
export class BeneficiarioDetalleView {
  @ViewColumn()
  beneficiario_id!: number;

  @ViewColumn()
  persona_id!: number;

  @ViewColumn()
  nombre_completo!: string;

  @ViewColumn()
  genero!: string | null; // 'F' | 'M' | NULL

  @ViewColumn()
  fecha_nacimiento!: Date | null;

  @ViewColumn()
  municipio_id!: number | null;

  @ViewColumn()
  nombre_municipio!: string | null;

  @ViewColumn()
  departamento_id!: number | null;

  @ViewColumn()
  nombre_departamento!: string | null;

  @ViewColumn()
  estado_beneficiario!: number;

  @ViewColumn()
  fecha_inicio!: Date;

  @ViewColumn()
  latitud!: string;

  @ViewColumn()
  longitud!: string;

  @ViewColumn()
  edad!: number | null;

  @ViewColumn()
  es_mayor_edad!: 0 | 1 | null;
}

