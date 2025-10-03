import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiarioDetalleAggView } from '../reporting/entities/vw-beneficiarios-detalle-agg.view';

type AggListFilters = {
  proyectoId?: number; // filtra via FIND_IN_SET
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
export class BeneficiariosDetalleAggService {
  constructor(
    @InjectRepository(BeneficiarioDetalleAggView)
    private readonly viewRepo: Repository<BeneficiarioDetalleAggView>,
  ) {}

  private buildQb(filters: AggListFilters) {
    const qb = this.viewRepo.createQueryBuilder('v');
    if (typeof filters.proyectoId === 'number') qb.andWhere('FIND_IN_SET(:pid, v.proyectos_ids) > 0', { pid: String(filters.proyectoId) });
    if (typeof filters.municipioId === 'number') qb.andWhere('v.municipio_id = :municipioId', { municipioId: filters.municipioId });
    if (typeof filters.departamentoId === 'number') qb.andWhere('v.departamento_id = :departamentoId', { departamentoId: filters.departamentoId });
    if (typeof filters.estadoBeneficiario === 'number') qb.andWhere('v.estado_beneficiario = :estadoBeneficiario', { estadoBeneficiario: filters.estadoBeneficiario });
    if (typeof filters.mayorEdad === 'boolean') qb.andWhere('v.es_mayor_edad = :esMayor', { esMayor: filters.mayorEdad ? 1 : 0 });
    if (filters.q) qb.andWhere('v.nombre_completo LIKE :q', { q: `%${filters.q.trim()}%` });
    return qb;
  }

  async listar(filters: AggListFilters = {}) {
    const useRange = typeof filters.start === 'number' && Number.isFinite(filters.start) && typeof filters.end === 'number' && Number.isFinite(filters.end);
    const usePage = typeof filters.page === 'number' && filters.page > 0 && typeof filters.pageSize === 'number' && filters.pageSize > 0;

    const qb = this.buildQb(filters);
    const total = await qb.clone().getCount();
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
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
      proyectosIds: r.proyectos_ids,
      proyectosNombres: r.proyectos_nombres,
    }));

    if (useRange) {
      const start = Math.max(0, Math.floor(filters.start!));
      const end = Math.max(start, Math.floor(filters.end!));
      return { total, start, end, items };
    }
    return { total, items };
  }

  async obtenerUno(beneficiarioId: number) {
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) throw new BadRequestException('beneficiarioId inválido');
    const r = await this.viewRepo
      .createQueryBuilder('v')
      .where('v.beneficiario_id = :id', { id: beneficiarioId })
      .getOne();
    if (!r) throw new NotFoundException('No se encontró el beneficiario indicado');
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
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
      proyectosIds: r.proyectos_ids,
      proyectosNombres: r.proyectos_nombres,
    };
  }

  async exportCsv(filters: AggListFilters = {}) {
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
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
      proyectosIds: r.proyectos_ids,
      proyectosNombres: r.proyectos_nombres,
    }));

    const headers = [
      'beneficiarioId',
      'personaId',
      'nombreCompleto',
      'genero',
      'fechaNacimiento',
      'municipioId',
      'nombreMunicipio',
      'departamentoId',
      'nombreDepartamento',
      'estadoBeneficiario',
      'fechaInicio',
      'latitud',
      'longitud',
      'edad',
      'esMayorEdad',
      'proyectosIds',
      'proyectosNombres',
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n,;]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const it of items) {
      const row = [
        it.beneficiarioId,
        it.personaId,
        it.nombreCompleto,
        it.genero ?? '',
        it.fechaNacimiento ?? '',
        it.municipioId ?? '',
        it.nombreMunicipio ?? '',
        it.departamentoId ?? '',
        it.nombreDepartamento ?? '',
        it.estadoBeneficiario,
        it.fechaInicio,
        it.latitud,
        it.longitud,
        it.edad ?? '',
        it.esMayorEdad ? 1 : 0,
        it.proyectosIds ?? '',
        it.proyectosNombres ?? '',
      ].map(escapeCsv);
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  async exportXlsx(filters: AggListFilters = {}) {
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
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      esMayorEdad:
        r.es_mayor_edad === null || r.es_mayor_edad === undefined
          ? (r.edad === null || r.edad === undefined ? false : Number(r.edad) >= 18)
          : Number(r.es_mayor_edad) === 1,
      proyectosIds: r.proyectos_ids,
      proyectosNombres: r.proyectos_nombres,
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Benef-Aggregate');
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
      { header: 'edad', key: 'edad', width: 8 },
      { header: 'esMayorEdad', key: 'esMayorEdad', width: 12 },
      { header: 'proyectosIds', key: 'proyectosIds', width: 24 },
      { header: 'proyectosNombres', key: 'proyectosNombres', width: 40 },
    ];

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 17 } } as any;

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
        edad: it.edad ?? '',
        esMayorEdad: it.esMayorEdad ? 1 : 0,
        proyectosIds: it.proyectosIds ?? '',
        proyectosNombres: it.proyectosNombres ?? '',
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
