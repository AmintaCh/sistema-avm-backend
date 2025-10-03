import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'vw_beneficiarios_detalle_proyecto', expression: `SELECT 1` })
export class BeneficiarioDetalleProyectoView {
  @ViewColumn()
  beneficiario_id!: number;

  @ViewColumn()
  persona_id!: number;

  @ViewColumn()
  nombre_completo!: string;

  @ViewColumn()
  genero!: string | null;

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

  // Proyecto
  @ViewColumn()
  proyecto_id!: number;

  @ViewColumn()
  nombre_proyecto!: string;

  @ViewColumn()
  fecha_incorporacion_proyecto!: Date;

  @ViewColumn()
  estado_en_proyecto!: number;

  // Edad y mayor de edad
  @ViewColumn()
  edad!: number | null;

  @ViewColumn()
  es_mayor_edad!: 0 | 1 | null;
}

