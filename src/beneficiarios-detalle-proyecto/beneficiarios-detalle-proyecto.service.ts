import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiarioDetalleProyectoView } from '../reporting/entities/vw-beneficiarios-detalle-proyecto.view';

type ProyectoListFilters = {
  proyectoId?: number;
  estadoEnProyecto?: number;
  municipioId?: number;
  departamentoId?: number;
  estadoBeneficiario?: number;
  q?: string; // nombre_completo
  mayorEdad?: boolean; // es_mayor_edad
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
};

@Injectable()
export class BeneficiariosDetalleProyectoService {
  constructor(
    @InjectRepository(BeneficiarioDetalleProyectoView)
    private readonly viewRepo: Repository<BeneficiarioDetalleProyectoView>,
  ) {}

  private buildQb(filters: ProyectoListFilters) {
    const qb = this.viewRepo.createQueryBuilder('v');
    if (typeof filters.proyectoId === 'number') qb.andWhere('v.proyecto_id = :proyectoId', { proyectoId: filters.proyectoId });
    if (typeof filters.estadoEnProyecto === 'number')
      qb.andWhere('v.estado_en_proyecto = :estadoEnProyecto', { estadoEnProyecto: filters.estadoEnProyecto });
    if (typeof filters.municipioId === 'number') qb.andWhere('v.municipio_id = :municipioId', { municipioId: filters.municipioId });
    if (typeof filters.departamentoId === 'number') qb.andWhere('v.departamento_id = :departamentoId', { departamentoId: filters.departamentoId });
    if (typeof filters.estadoBeneficiario === 'number') qb.andWhere('v.estado_beneficiario = :estadoBeneficiario', { estadoBeneficiario: filters.estadoBeneficiario });
    if (typeof filters.mayorEdad === 'boolean') qb.andWhere('v.es_mayor_edad = :esMayor', { esMayor: filters.mayorEdad ? 1 : 0 });
    if (filters.q) qb.andWhere('v.nombre_completo LIKE :q', { q: `%${filters.q.trim()}%` });
    return qb;
  }

  async listar(filters: ProyectoListFilters = {}) {
    const useRange = typeof filters.start === 'number' && Number.isFinite(filters.start) && typeof filters.end === 'number' && Number.isFinite(filters.end);
    const usePage = typeof filters.page === 'number' && filters.page > 0 && typeof filters.pageSize === 'number' && filters.pageSize > 0;

    const qb = this.buildQb(filters);
    const countQb = qb.clone();
    const total = await countQb.getCount();

    qb.orderBy('v.nombre_completo', 'ASC');
    if (useRange) {
      const start = Math.max(0, Math.floor(filters.start!));
      const end = Math.max(start, Math.floor(filters.end!));
      const take = Math.max(0, end - start + 1);
      qb.offset(start).limit(take);
    } else if (usePage) {
      const page = Math.floor(filters.page!);
      const pageSize = Math.min(Math.floor(filters.pageSize!), 100);
      const offset = (page - 1) * pageSize;
      qb.offset(offset).limit(pageSize);
    }

    const rows = await qb.getMany();
    const items = rows.map((r) => ({
      beneficiarioId: r.beneficiario_id,
      personaId: r.persona_id,
      nombreCompleto: r.nombre_completo,
      genero: r.genero,
      fechaNacimiento: r.fecha_nacimiento,
      municipioId: r.municipio_id,
      nombreMunicipio: r.nombre_municipio,
      departamentoId: r.departamento_id,
      nombreDepartamento: r.nombre_departamento,
      estadoBeneficiario: r.estado_beneficiario,
      fechaInicio: r.fecha_inicio,
      latitud: r.latitud,
      longitud: r.longitud,
      proyectoId: r.proyecto_id,
      nombreProyecto: r.nombre_proyecto,
      fechaIncorporacionProyecto: r.fecha_incorporacion_proyecto,
      estadoEnProyecto: r.estado_en_proyecto,
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
    }));

    if (useRange) {
      return { total, start: Math.max(0, Math.floor(filters.start!)), end: Math.max(Math.max(0, Math.floor(filters.start!)), Math.floor(filters.end!)), items };
    }
    return { total, items };
  }

  async obtenerUno(beneficiarioId: number, proyectoId: number) {
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) throw new BadRequestException('beneficiarioId inválido');
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) throw new BadRequestException('proyectoId inválido');
    const r = await this.viewRepo
      .createQueryBuilder('v')
      .where('v.beneficiario_id = :bid AND v.proyecto_id = :pid', { bid: beneficiarioId, pid: proyectoId })
      .getOne();
    if (!r) throw new NotFoundException('No se encontró el registro solicitado');
    return {
      beneficiarioId: r.beneficiario_id,
      personaId: r.persona_id,
      nombreCompleto: r.nombre_completo,
      genero: r.genero,
      fechaNacimiento: r.fecha_nacimiento,
      municipioId: r.municipio_id,
      nombreMunicipio: r.nombre_municipio,
      departamentoId: r.departamento_id,
      nombreDepartamento: r.nombre_departamento,
      estadoBeneficiario: r.estado_beneficiario,
      fechaInicio: r.fecha_inicio,
      latitud: r.latitud,
      longitud: r.longitud,
      proyectoId: r.proyecto_id,
      nombreProyecto: r.nombre_proyecto,
      fechaIncorporacionProyecto: r.fecha_incorporacion_proyecto,
      estadoEnProyecto: r.estado_en_proyecto,
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
    };
  }

  async exportXlsx(filters: ProyectoListFilters = {}) {
    const ExcelJS = require('exceljs');
    const qb = this.buildQb(filters);
    qb.orderBy('v.nombre_completo', 'ASC');
    const rows = await qb.getMany();

    const items = rows.map((r) => ({
      beneficiarioId: r.beneficiario_id,
      personaId: r.persona_id,
      nombreCompleto: r.nombre_completo,
      genero: r.genero,
      fechaNacimiento: r.fecha_nacimiento,
      municipioId: r.municipio_id,
      nombreMunicipio: r.nombre_municipio,
      departamentoId: r.departamento_id,
      nombreDepartamento: r.nombre_departamento,
      estadoBeneficiario: r.estado_beneficiario,
      fechaInicio: r.fecha_inicio,
      latitud: r.latitud,
      longitud: r.longitud,
      proyectoId: r.proyecto_id,
      nombreProyecto: r.nombre_proyecto,
      fechaIncorporacionProyecto: r.fecha_incorporacion_proyecto,
      estadoEnProyecto: r.estado_en_proyecto,
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Benef-Proyecto');
    sheet.columns = [
      { header: 'beneficiarioId', key: 'beneficiarioId', width: 14 },
      { header: 'personaId', key: 'personaId', width: 12 },
      { header: 'nombreCompleto', key: 'nombreCompleto', width: 32 },
      { header: 'genero', key: 'genero', width: 8 },
      { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'municipioId', key: 'municipioId', width: 12 },
      { header: 'nombreMunicipio', key: 'nombreMunicipio', width: 22 },
      { header: 'departamentoId', key: 'departamentoId', width: 16 },
      { header: 'nombreDepartamento', key: 'nombreDepartamento', width: 24 },
      { header: 'estadoBeneficiario', key: 'estadoBeneficiario', width: 18 },
      { header: 'fechaInicio', key: 'fechaInicio', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'latitud', key: 'latitud', width: 14 },
      { header: 'longitud', key: 'longitud', width: 14 },
      { header: 'proyectoId', key: 'proyectoId', width: 12 },
      { header: 'nombreProyecto', key: 'nombreProyecto', width: 28 },
      { header: 'fechaIncorporacionProyecto', key: 'fechaIncorporacionProyecto', width: 22, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'estadoEnProyecto', key: 'estadoEnProyecto', width: 18 },
      { header: 'edad', key: 'edad', width: 8 },
      { header: 'esMayorEdad', key: 'esMayorEdad', width: 12 },
    ];

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 19 } } as any;

    const toDate = (v: any): Date | null => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    for (const it of items) {
      const row = sheet.addRow({
        beneficiarioId: it.beneficiarioId,
        personaId: it.personaId,
        nombreCompleto: it.nombreCompleto,
        genero: it.genero ?? '',
        fechaNacimiento: toDate(it.fechaNacimiento) ?? it.fechaNacimiento ?? '',
        municipioId: it.municipioId ?? '',
        nombreMunicipio: it.nombreMunicipio ?? '',
        departamentoId: it.departamentoId ?? '',
        nombreDepartamento: it.nombreDepartamento ?? '',
        estadoBeneficiario: it.estadoBeneficiario,
        fechaInicio: toDate(it.fechaInicio) ?? it.fechaInicio ?? '',
        latitud: it.latitud,
        longitud: it.longitud,
        proyectoId: it.proyectoId,
        nombreProyecto: it.nombreProyecto,
        fechaIncorporacionProyecto: toDate(it.fechaIncorporacionProyecto) ?? it.fechaIncorporacionProyecto ?? '',
        estadoEnProyecto: it.estadoEnProyecto,
        edad: it.edad ?? '',
        esMayorEdad: it.esMayorEdad ? 1 : 0,
      });
      row.commit();
    }

    const header = sheet.getRow(1);
    header.font = { bold: true } as any;
    header.alignment = { vertical: 'middle' } as any;
    header.commit();

    const buffer: Buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
