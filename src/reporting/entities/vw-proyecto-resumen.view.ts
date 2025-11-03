import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'vw_proyecto_resumen',
  expression: `
    SELECT
      p.proyecto_id,
      p.nombre_proyecto,
      p.fecha_inicio,
      p.fecha_fin,
      p.estado_id AS estado_proyecto,

      COALESCE(a.total, 0)                  AS actividades_total,
      COALESCE(a.realizadas, 0)             AS actividades_realizadas,
      COALESCE(a.pendientes, 0)             AS actividades_pendientes,

      COALESCE(e.total_entregas, 0)         AS beneficios_entregas_total,
      COALESCE(e.beneficios_distintos, 0)   AS beneficios_beneficios_distintos,
      COALESCE(e.cantidad_total, 0)         AS beneficios_cantidad_total,

      COALESCE(b.total_beneficiarios, 0)    AS beneficiarios_total,
      COALESCE(b.beneficiarios_activos, 0)  AS beneficiarios_activos
    FROM proyecto p
    LEFT JOIN (
      SELECT
        ac.proyecto_id,
        COUNT(*) AS total,
        SUM(CASE WHEN ac.fecha_actividad <= CURDATE() THEN 1 ELSE 0 END) AS realizadas,
        SUM(CASE WHEN ac.fecha_actividad  > CURDATE() THEN 1 ELSE 0 END) AS pendientes
      FROM actividad ac
      GROUP BY ac.proyecto_id
    ) a ON a.proyecto_id = p.proyecto_id
    LEFT JOIN (
      SELECT
        eb.proyecto_id,
        COUNT(*) AS total_entregas,
        COUNT(DISTINCT eb.beneficio_id) AS beneficios_distintos,
        COALESCE(SUM(eb.cantidad), 0) AS cantidad_total
      FROM entrega_beneficio eb
      GROUP BY eb.proyecto_id
    ) e ON e.proyecto_id = p.proyecto_id
    LEFT JOIN (
      SELECT
        bp.proyecto_id,
        COUNT(*) AS total_beneficiarios,
        SUM(CASE WHEN bp.estado_id = 1 THEN 1 ELSE 0 END) AS beneficiarios_activos
      FROM beneficiario_proyecto bp
      GROUP BY bp.proyecto_id
    ) b ON b.proyecto_id = p.proyecto_id
  `,
})
export class ProyectoResumenView {
  @ViewColumn()
  proyecto_id!: number;

  @ViewColumn()
  nombre_proyecto!: string;

  @ViewColumn()
  fecha_inicio!: string; // date

  @ViewColumn()
  fecha_fin!: string | null; // date

  @ViewColumn()
  estado_proyecto!: number;

  @ViewColumn()
  actividades_total!: number;

  @ViewColumn()
  actividades_realizadas!: number;

  @ViewColumn()
  actividades_pendientes!: number;

  @ViewColumn()
  beneficios_entregas_total!: number;

  @ViewColumn()
  beneficios_beneficios_distintos!: number;

  @ViewColumn()
  beneficios_cantidad_total!: string; // decimal as string

  @ViewColumn()
  beneficiarios_total!: number;

  @ViewColumn()
  beneficiarios_activos!: number;
}

