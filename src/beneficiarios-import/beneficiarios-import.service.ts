import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { Beneficiario } from '../entities/beneficiario.entity';
import { Municipio } from '../entities/municipio.entity';
import { BeneficiarioProyecto } from '../entities/beneficiario-proyecto.entity';
import { Proyecto } from '../entities/proyecto.entity';
import { Readable } from 'stream';

type ImportOptions = {
  filename: string;
  buffer: Buffer;
  proyectoId?: number;
  mode: 'insert' | 'upsert' | 'skip-duplicates';
  dryRun?: boolean;
  // strict=true: si hay filas inválidas, rechaza toda la carga con 400
  // strict=false: procesa válidas y omite inválidas (comportamiento anterior)
  strict?: boolean;
};

type RawRow = Record<string, unknown>;

type ParsedRow = {
  // Persona
  tipoDocumento?: string | null;
  numeroDocumento: string; // requerido para deduplicar
  primerNombre: string;
  segundoNombre?: string | null;
  tercerNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  genero?: string | null; // 'M' | 'F'
  fechaNacimiento?: string | null; // YYYY-MM-DD
  telefono?: string | null;
  direccionDetalle?: string | null;
  municipioId?: number | null;

  // Beneficiario
  estadoBeneficiario: number; // estado_id
  fechaInicio: string; // YYYY-MM-DD
  latitud: string;
  longitud: string;

  // Vinculación opcional
  proyectoId?: number | null; // si no viene, se usa el query param
  fechaIncorporacion?: string | null; // YYYY-MM-DD
  estadoEnProyecto?: number | null;
};

@Injectable()
export class BeneficiariosImportService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Beneficiario) private readonly beneficiarioRepo: Repository<Beneficiario>,
    @InjectRepository(Municipio) private readonly municipioRepo: Repository<Municipio>,
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(BeneficiarioProyecto) private readonly bpRepo: Repository<BeneficiarioProyecto>,
  ) {}

  private normalizeHeader(h: string): string {
    return h
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[_.-]/g, '');
  }

  private pick<T>(row: RawRow, keys: string[]): Partial<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    const map: Record<string, string> = {};
    keys.forEach((k) => (map[this.normalizeHeader(k)] = k));
    for (const [k, v] of Object.entries(row)) {
      const nk = this.normalizeHeader(k);
      const original = map[nk];
      if (original) out[original] = v;
    }
    return out;
  }

  private toParsedRow(row: RawRow): ParsedRow {
    const r = this.pick(row, [
      'tipoDocumento',
      'numeroDocumento',
      'primerNombre',
      'segundoNombre',
      'tercerNombre',
      'primerApellido',
      'segundoApellido',
      'genero',
      'fechaNacimiento',
      'telefono',
      'direccionDetalle',
      'municipioId',
      'estadoBeneficiario',
      'fechaInicio',
      'latitud',
      'longitud',
      'proyectoId',
      'fechaIncorporacion',
      'estadoEnProyecto',
    ]);

    const numeroDocumento = String(r.numeroDocumento ?? '').trim();
    const primerNombre = String(r.primerNombre ?? '').trim();
    const primerApellido = String(r.primerApellido ?? '').trim();
    const fechaInicio = String(r.fechaInicio ?? '').trim();
    const latitud = String(r.latitud ?? '').trim();
    const longitud = String(r.longitud ?? '').trim();
    const estadoBeneficiario = r.estadoBeneficiario !== undefined && r.estadoBeneficiario !== null ? Number(r.estadoBeneficiario) : NaN;

    return {
      tipoDocumento: r.tipoDocumento ? String(r.tipoDocumento).trim() : null,
      numeroDocumento,
      primerNombre,
      segundoNombre: r.segundoNombre ? String(r.segundoNombre).trim() : null,
      tercerNombre: r.tercerNombre ? String(r.tercerNombre).trim() : null,
      primerApellido,
      segundoApellido: r.segundoApellido ? String(r.segundoApellido).trim() : null,
      genero: r.genero ? String(r.genero).trim() : null,
      fechaNacimiento: r.fechaNacimiento ? String(r.fechaNacimiento).trim() : null,
      telefono: r.telefono ? String(r.telefono).trim() : null,
      direccionDetalle: r.direccionDetalle ? String(r.direccionDetalle).trim() : null,
      municipioId: r.municipioId !== undefined && r.municipioId !== null && !Number.isNaN(Number(r.municipioId)) ? Number(r.municipioId) : null,
      estadoBeneficiario,
      fechaInicio,
      latitud,
      longitud,
      proyectoId: r.proyectoId !== undefined && r.proyectoId !== null && !Number.isNaN(Number(r.proyectoId)) ? Number(r.proyectoId) : null,
      fechaIncorporacion: r.fechaIncorporacion ? String(r.fechaIncorporacion).trim() : null,
      estadoEnProyecto: r.estadoEnProyecto !== undefined && r.estadoEnProyecto !== null && !Number.isNaN(Number(r.estadoEnProyecto)) ? Number(r.estadoEnProyecto) : null,
    } as ParsedRow;
  }

  private async parseExcelOrCsv(filename: string, buffer: Buffer): Promise<RawRow[]> {
    const ExcelJS = require('exceljs');
    const ext = filename.toLowerCase().split('.').pop();
    const workbook = new ExcelJS.Workbook();

    if (ext === 'xlsx' || ext === 'xls') {
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new BadRequestException('El archivo XLSX no contiene hojas');
      const headers: string[] = [];
      const data: RawRow[] = [];
      sheet.eachRow((row, rowNumber) => {
        const values = row.values as any[];
        // row.values es 1-based; normalicemos a 0-based
        const cells = values.slice(1);
        if (rowNumber === 1) {
          cells.forEach((v) => headers.push(String(v ?? '').trim()));
        } else {
          const o: RawRow = {};
          headers.forEach((h, i) => (o[h] = cells[i] ?? null));
          // excluir filas totalmente vacías
          if (Object.values(o).some((v) => v !== null && String(v).trim() !== '')) data.push(o);
        }
      });
      return data;
    }

    if (ext === 'csv' || ext === 'txt') {
      // ExcelJS también soporta CSV
      const wb = new ExcelJS.Workbook();
      const stream = Readable.from(buffer.toString('utf8'));
      await wb.csv.read(stream);
      const sheet = wb.worksheets[0];
      if (!sheet) throw new BadRequestException('El CSV está vacío');
      const headers: string[] = [];
      const data: RawRow[] = [];
      sheet.eachRow((row, rowNumber) => {
        const values = row.values as any[];
        const cells = values.slice(1);
        if (rowNumber === 1) {
          cells.forEach((v) => headers.push(String(v ?? '').trim()));
        } else {
          const o: RawRow = {};
          headers.forEach((h, i) => (o[h] = cells[i] ?? null));
          if (Object.values(o).some((v) => v !== null && String(v).trim() !== '')) data.push(o);
        }
      });
      return data;
    }

    throw new BadRequestException('Formato no soportado. Usa .csv o .xlsx');
  }

  private validateRow(row: ParsedRow): string[] {
    const errors: string[] = [];
    if (!row.numeroDocumento) errors.push('numeroDocumento es requerido');
    if (!row.primerNombre) errors.push('primerNombre es requerido');
    if (!row.primerApellido) errors.push('primerApellido es requerido');
    if (!row.fechaInicio) errors.push('fechaInicio es requerido');
    if (!row.latitud) errors.push('latitud es requerido');
    if (!row.longitud) errors.push('longitud es requerido');
    if (Number.isNaN(row.estadoBeneficiario)) errors.push('estadoBeneficiario inválido');
    if (row.municipioId !== null && row.municipioId !== undefined && row.municipioId <= 0) errors.push('municipioId inválido');
    return errors;
  }

  async importarArchivo(opts: ImportOptions) {
    const raws = await this.parseExcelOrCsv(opts.filename, opts.buffer);
    const parsed: ParsedRow[] = raws.map((r) => this.toParsedRow(r));
    const results: { index: number; ok: boolean; errors?: string[]; beneficiarioId?: number; personaId?: number }[] = [];

    // Validación previa
    parsed.forEach((row, idx) => {
      const errs = this.validateRow(row);
      if (errs.length) results.push({ index: idx + 2, ok: false, errors: errs }); // +2 por encabezado 1-based
      else results.push({ index: idx + 2, ok: true });
    });

    const hasErrors = results.some((r) => !r.ok);
    // En modo dryRun devolvemos el detalle sin lanzar error
    if (opts.dryRun) {
      return {
        total: parsed.length,
        processed: hasErrors ? 0 : parsed.length,
        dryRun: true,
        errors: results.filter((r) => !r.ok),
      };
    }

    // Validación estricta por defecto: si hay errores, rechazamos la carga
    const isStrict = opts.strict !== false; // default true
    if (hasErrors && isStrict) {
      const errorDetail = results.filter((r) => !r.ok);
      throw new BadRequestException({
        message: 'El archivo contiene filas inválidas. Corrija antes de cargar.',
        total: parsed.length,
        totalErrors: errorDetail.length,
        errors: errorDetail,
      });
    }

    // Procesar en transacción
    const processed = await this.dataSource.transaction(async (trx) => {
      let count = 0;
      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i];
        const res = results[i];
        if (!res.ok) continue; // saltar inválidas en ejecución real

        // Validaciones referenciales
        if (row.municipioId) {
          const muni = await trx.getRepository(Municipio).findOne({ where: { municipioId: row.municipioId } });
          if (!muni) {
            res.ok = false;
            res.errors = ['municipioId no existe'];
            continue;
          }
        }

        let persona = await trx.getRepository(Persona).findOne({ where: { numeroDocumento: row.numeroDocumento } });

        if (!persona) {
          if (opts.mode === 'skip-duplicates') {
            // en este modo solo insertamos si no existe; aquí no existe, entonces insertaremos
          }
          // Insertar persona
          persona = trx.getRepository(Persona).create({
            numeroDocumento: row.numeroDocumento,
            tipoDocumento: row.tipoDocumento ?? null,
            primerNombre: row.primerNombre,
            segundoNombre: row.segundoNombre ?? null,
            tercerNombre: row.tercerNombre ?? null,
            primerApellido: row.primerApellido,
            segundoApellido: row.segundoApellido ?? null,
            genero: row.genero ?? null,
            fechaNacimiento: row.fechaNacimiento ?? null,
            telefono: row.telefono ?? null,
            direccionDetalle: row.direccionDetalle ?? null,
            municipioId: row.municipioId ?? null,
          });
          persona = await trx.getRepository(Persona).save(persona);
        } else {
          // Existe persona
          if (opts.mode === 'insert') {
            res.ok = false;
            res.errors = ['Persona duplicada por numeroDocumento'];
            continue;
          }
          // upsert/skip-duplicates -> actualizamos datos básicos excepto numeroDocumento
          if (opts.mode === 'upsert') {
            persona.primerNombre = row.primerNombre;
            persona.segundoNombre = row.segundoNombre ?? null;
            persona.tercerNombre = row.tercerNombre ?? null;
            persona.primerApellido = row.primerApellido;
            persona.segundoApellido = row.segundoApellido ?? null;
            persona.genero = row.genero ?? null;
            persona.fechaNacimiento = row.fechaNacimiento ?? null;
            persona.telefono = row.telefono ?? null;
            persona.direccionDetalle = row.direccionDetalle ?? null;
            persona.municipioId = row.municipioId ?? null;
            await trx.getRepository(Persona).save(persona);
          }
        }

        // Beneficiario por persona
        let beneficiario = await trx
          .getRepository(Beneficiario)
          .createQueryBuilder('b')
          .innerJoin('b.persona', 'p')
          .where('p.numeroDocumento = :nd', { nd: row.numeroDocumento })
          .getOne();

        if (!beneficiario) {
          beneficiario = trx.getRepository(Beneficiario).create({
            persona: { personaId: persona.personaId } as any,
            estadoId: row.estadoBeneficiario,
            fechaInicio: row.fechaInicio,
            latitud: row.latitud,
            longitud: row.longitud,
          });
          beneficiario = await trx.getRepository(Beneficiario).save(beneficiario);
        } else if (opts.mode !== 'skip-duplicates') {
          // actualizar datos del beneficiario si upsert
          beneficiario.estadoId = row.estadoBeneficiario;
          beneficiario.fechaInicio = row.fechaInicio;
          beneficiario.latitud = row.latitud;
          beneficiario.longitud = row.longitud;
          await trx.getRepository(Beneficiario).save(beneficiario);
        }

        res.beneficiarioId = beneficiario.beneficiarioId;
        res.personaId = persona.personaId;

        // Vinculación a proyecto si corresponde
        const linkProyectoId = row.proyectoId ?? opts.proyectoId ?? null;
        if (linkProyectoId) {
          const proyecto = await trx.getRepository(Proyecto).findOne({ where: { proyectoId: linkProyectoId } });
          if (!proyecto) {
            // si no existe, reportamos pero no rompemos el resto del lote
            res.ok = false;
            res.errors = [`proyectoId ${linkProyectoId} no existe`];
          } else {
            const existing = await trx.getRepository(BeneficiarioProyecto).findOne({ where: { beneficiarioId: beneficiario.beneficiarioId, proyectoId: linkProyectoId } });
            if (!existing) {
              const bp = trx.getRepository(BeneficiarioProyecto).create({
                beneficiarioId: beneficiario.beneficiarioId,
                proyectoId: linkProyectoId,
                fechaIncorporacion: row.fechaIncorporacion ?? row.fechaInicio,
                estadoId: row.estadoEnProyecto ?? 1,
              });
              await trx.getRepository(BeneficiarioProyecto).save(bp);
            } else if (opts.mode !== 'skip-duplicates') {
              existing.fechaIncorporacion = row.fechaIncorporacion ?? existing.fechaIncorporacion;
              if (row.estadoEnProyecto !== null && row.estadoEnProyecto !== undefined) existing.estadoId = row.estadoEnProyecto;
              await trx.getRepository(BeneficiarioProyecto).save(existing);
            }
          }
        }

        count++;
      }
      return count;
    });

    return {
      total: parsed.length,
      processed,
      errors: results.filter((r) => !r.ok),
      sampleOk: results.filter((r) => r.ok).slice(0, 5),
    };
  }

  async generarTemplateXlsx(): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Template-Beneficiarios');

    ws.columns = [
      { header: 'tipoDocumento', key: 'tipoDocumento', width: 16 },
      { header: 'numeroDocumento', key: 'numeroDocumento', width: 18 },
      { header: 'primerNombre', key: 'primerNombre', width: 18 },
      { header: 'segundoNombre', key: 'segundoNombre', width: 18 },
      { header: 'tercerNombre', key: 'tercerNombre', width: 18 },
      { header: 'primerApellido', key: 'primerApellido', width: 18 },
      { header: 'segundoApellido', key: 'segundoApellido', width: 18 },
      { header: 'genero', key: 'genero', width: 10 },
      { header: 'fechaNacimiento', key: 'fechaNacimiento', width: 16, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'telefono', key: 'telefono', width: 16 },
      { header: 'direccionDetalle', key: 'direccionDetalle', width: 28 },
      { header: 'municipioId', key: 'municipioId', width: 12 },
      { header: 'estadoBeneficiario', key: 'estadoBeneficiario', width: 18 },
      { header: 'fechaInicio', key: 'fechaInicio', width: 16, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'latitud', key: 'latitud', width: 14 },
      { header: 'longitud', key: 'longitud', width: 14 },
      { header: 'proyectoId', key: 'proyectoId', width: 12 },
      { header: 'fechaIncorporacion', key: 'fechaIncorporacion', width: 16, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'estadoEnProyecto', key: 'estadoEnProyecto', width: 18 },
    ];

    // Encabezado en negrita y autofiltro
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } } as any;
    const header = ws.getRow(1);
    header.font = { bold: true } as any;
    header.commit();

    // Validaciones de datos
    // Genero: lista M/F/NULL
    ws.getColumn('genero').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber === 1) return;
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"M,F"'],
        showErrorMessage: true,
        errorStyle: 'warning',
        error: 'Valor inválido. Use M o F.',
      } as any;
    });

    // Fechas: formato yyyy-mm-dd (ya puesto en columnas)

    // Fila de ejemplo
    ws.addRow({
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      primerNombre: 'Juan',
      segundoNombre: '',
      tercerNombre: '',
      primerApellido: 'Pérez',
      segundoApellido: '',
      genero: 'M',
      fechaNacimiento: new Date('2000-01-15'),
      telefono: '555-1234',
      direccionDetalle: 'Calle 1 #2-3',
      municipioId: '',
      estadoBeneficiario: 1,
      fechaInicio: new Date(),
      latitud: '14.624',
      longitud: '-90.519',
      proyectoId: '',
      fechaIncorporacion: '',
      estadoEnProyecto: 1,
    });

    // Nota/instrucciones en una hoja aparte
    const info = wb.addWorksheet('Instrucciones');
    info.getCell('A1').value =
      'Instrucciones: Rellene la hoja Template-Beneficiarios. Campos requeridos: numeroDocumento, primerNombre, primerApellido, estadoBeneficiario, fechaInicio, latitud, longitud. ' +
      'Opcional: municipioId, proyectoId, fechaIncorporacion, estadoEnProyecto. Formato de fechas: yyyy-mm-dd. Genero: M/F.';
    info.getCell('A1').alignment = { wrapText: true } as any;
    info.getColumn(1).width = 120;

    const buffer: Buffer = await wb.xlsx.writeBuffer();
    return buffer;
  }
}
