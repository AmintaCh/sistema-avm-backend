import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiarioDetalleView } from '../reporting/entities/vw-beneficiarios-detalle.view';

type ListFilters = {
  municipioId?: number;
  departamentoId?: number;
  estadoBeneficiario?: number;
  q?: string; // busca en nombre_completo
  mayorEdad?: boolean; // true => es_mayor_edad = 1; false => 0
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
};

@Injectable()
export class BeneficiariosDetalleService {
  constructor(
    @InjectRepository(BeneficiarioDetalleView)
    private readonly viewRepo: Repository<BeneficiarioDetalleView>,
  ) {}

  async listar(filters: ListFilters = {}) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (typeof filters.municipioId === 'number') {
      where.push('municipio_id = ?');
      params.push(filters.municipioId);
    }
    if (typeof filters.departamentoId === 'number') {
      where.push('departamento_id = ?');
      params.push(filters.departamentoId);
    }
    if (typeof filters.estadoBeneficiario === 'number') {
      where.push('estado_beneficiario = ?');
      params.push(filters.estadoBeneficiario);
    }
    if (typeof filters.mayorEdad === 'boolean') {
      where.push('es_mayor_edad = ?');
      params.push(filters.mayorEdad ? 1 : 0);
    }
    if (filters.q) {
      where.push('nombre_completo LIKE ?');
      params.push(`%${filters.q.trim()}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Pagination
    const useRange =
      typeof filters.start === 'number' && Number.isFinite(filters.start) &&
      typeof filters.end === 'number' && Number.isFinite(filters.end);
    const usePage =
      typeof filters.page === 'number' && filters.page > 0 &&
      typeof filters.pageSize === 'number' && filters.pageSize > 0;

    let limitSql = '';
    let startIdx: number | undefined;
    let endIdx: number | undefined;
    let page: number | undefined;
    let pageSize: number | undefined;

    if (useRange) {
      startIdx = Math.max(0, Math.floor(filters.start!));
      endIdx = Math.max(startIdx, Math.floor(filters.end!));
      const take = Math.max(0, endIdx - startIdx + 1);
      limitSql = ` LIMIT ${take} OFFSET ${startIdx}`;
    } else if (usePage) {
      page = Math.floor(filters.page!);
      pageSize = Math.min(Math.floor(filters.pageSize!), 100);
      const offset = (page - 1) * pageSize;
      limitSql = ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    // Build via QB on the view entity
    const qb = this.viewRepo.createQueryBuilder('v');
    where.forEach((w, idx) => qb.andWhere(w.replace(/\?/g, `:p${idx}`), { [`p${idx}`]: params[idx] }));

    const countQb = qb.clone();
    const total = await countQb.getCount();

    qb.orderBy('v.nombre_completo', 'ASC');
    if (limitSql) {
      // We already computed pagination. Re-derive from params for QB
      if (useRange) {
        const take = Math.max(0, endIdx! - startIdx! + 1);
        qb.offset(startIdx!).limit(take);
      } else if (usePage) {
        const offset = (page! - 1) * pageSize!;
        qb.offset(offset).limit(pageSize!);
      }
    }

    const rows = await qb.getMany();

    const items = rows.map((r: any) => ({
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
    }));

    if (useRange) {
      return { total, start: startIdx!, end: endIdx!, items };
    }
    return { total, items };
  }

  private buildQueryForFilters(filters: ListFilters) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (typeof filters.municipioId === 'number') {
      where.push('municipio_id = ?');
      params.push(filters.municipioId);
    }
    if (typeof filters.departamentoId === 'number') {
      where.push('departamento_id = ?');
      params.push(filters.departamentoId);
    }
    if (typeof filters.estadoBeneficiario === 'number') {
      where.push('estado_beneficiario = ?');
      params.push(filters.estadoBeneficiario);
    }
    if (typeof filters.mayorEdad === 'boolean') {
      where.push('es_mayor_edad = ?');
      params.push(filters.mayorEdad ? 1 : 0);
    }
    if (filters.q) {
      where.push('nombre_completo LIKE ?');
      params.push(`%${filters.q.trim()}%`);
    }

    const qb = this.viewRepo.createQueryBuilder('v');
    where.forEach((w, idx) => qb.andWhere(w.replace(/\?/g, `:p${idx}`), { [`p${idx}`]: params[idx] }));
    return qb;
  }

  async exportCsv(filters: ListFilters = {}) {
    const qb = this.buildQueryForFilters(filters);
    qb.orderBy('v.nombre_completo', 'ASC');
    const rows = await qb.getMany();

    const items = rows.map((r: any) => ({
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
      ].map(escapeCsv);
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  async exportXlsx(filters: ListFilters = {}) {
    // Import at runtime to keep compile-time light
    const ExcelJS = require('exceljs');
    const qb = this.buildQueryForFilters(filters);
    qb.orderBy('v.nombre_completo', 'ASC');
    const rows = await qb.getMany();

    const items = rows.map((r: any) => ({
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
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Beneficiarios');
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
    ];

    // Freeze header row and add autofilter
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 15 },
    } as any;

    // Helper to parse date-like values
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
      });
      row.commit();
    }

    // Opcional: formato de cabecera
    const header = sheet.getRow(1);
    header.font = { bold: true } as any;
    header.alignment = { vertical: 'middle' } as any;
    header.commit();

    const buffer: Buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async obtenerPorId(beneficiarioId: number) {
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    const r = await this.viewRepo
      .createQueryBuilder('v')
      .where('v.beneficiario_id = :id', { id: beneficiarioId })
      .getOne();
    if (!r) {
      throw new NotFoundException('No se encontró el beneficiario indicado');
    }
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
    };
  }
}
