import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'vw_distribucion_beneficiarios_genero',
  expression: `
    SELECT
      CASE p.genero
        WHEN 'F' THEN 'Femenino'
        WHEN 'M' THEN 'Masculino'
        ELSE 'No especificado'
      END AS genero_desc,
      COUNT(*) AS total_beneficiarios,
      ROUND(COUNT(*) * 100 / NULLIF(t.total, 0), 2) AS porcentaje
    FROM beneficiario b
    INNER JOIN persona p ON p.persona_id = b.persona_id
    CROSS JOIN (
      SELECT COUNT(*) AS total
      FROM beneficiario
    ) t
    GROUP BY genero_desc, t.total
  `,
})
export class DistribucionBeneficiariosGeneroView {
  @ViewColumn()
  genero_desc!: string;

  @ViewColumn()
  total_beneficiarios!: number;

  @ViewColumn()
  porcentaje!: number;
}
