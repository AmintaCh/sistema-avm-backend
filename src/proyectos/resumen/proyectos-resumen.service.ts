import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProyectoResumenView } from '../../reporting/entities/vw-proyecto-resumen.view';

@Injectable()
export class ProyectosResumenService {
  constructor(
    @InjectRepository(ProyectoResumenView)
    private readonly viewRepo: Repository<ProyectoResumenView>,
  ) {}

  async listar() {
    const rows = await this.viewRepo
      .createQueryBuilder('v')
      .orderBy('v.proyecto_id', 'ASC')
      .getMany();
    return rows.map((r) => this.mapRow(r));
  }

  async obtener(proyectoId: number) {
    const r = await this.viewRepo.findOne({ where: { proyecto_id: proyectoId } as any });
    if (!r) throw new NotFoundException('Proyecto no encontrado');
    return this.mapRow(r);
  }

  private mapRow(r: ProyectoResumenView) {
    return {
      proyectoId: r.proyecto_id,
      nombreProyecto: r.nombre_proyecto,
      fechaInicio: r.fecha_inicio,
      fechaFin: r.fecha_fin,
      estadoProyecto: r.estado_proyecto,
      actividades: {
        total: Number(r.actividades_total),
        realizadas: Number(r.actividades_realizadas),
        pendientes: Number(r.actividades_pendientes),
      },
      beneficios: {
        entregasTotal: Number(r.beneficios_entregas_total),
        beneficiosDistintos: Number(r.beneficios_beneficios_distintos),
        cantidadTotal: r.beneficios_cantidad_total, // decimal string
      },
      beneficiarios: {
        total: Number(r.beneficiarios_total),
        activos: Number(r.beneficiarios_activos),
      },
    };
  }
}

