import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BeneficiariosDetalleAggService } from './beneficiarios-detalle-agg.service';

@Controller('beneficiarios-detalle-agg')
export class BeneficiariosDetalleAggController {
  constructor(private readonly service: BeneficiariosDetalleAggService) {}

  @Get()
  async listar(
    @Query('proyectoId') proyectoId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('estadoBeneficiario') estadoBeneficiario?: string,
    @Query('q') q?: string,
    @Query('mayorEdad') mayorEdad?: string, // 'true' | 'false' | '1' | '0'
    @Query('es_mayor_edad') mayorEdadSnake?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const proj = proyectoId !== undefined ? Number(proyectoId) : undefined;
    const mun = municipioId !== undefined ? Number(municipioId) : undefined;
    const dep = departamentoId !== undefined ? Number(departamentoId) : undefined;
    const est = estadoBeneficiario !== undefined ? Number(estadoBeneficiario) : undefined;
    const p = page !== undefined ? Number(page) : undefined;
    const ps = pageSize !== undefined ? Number(pageSize) : undefined;
    const mayorParam = mayorEdad ?? mayorEdadSnake;

    return this.service.listar({
      proyectoId: typeof proj === 'number' && !Number.isNaN(proj) ? proj : undefined,
      municipioId: typeof mun === 'number' && !Number.isNaN(mun) ? mun : undefined,
      departamentoId: typeof dep === 'number' && !Number.isNaN(dep) ? dep : undefined,
      estadoBeneficiario: typeof est === 'number' && !Number.isNaN(est) ? est : undefined,
      q,
      mayorEdad:
        typeof mayorParam === 'string'
          ? mayorParam === 'true' || mayorParam === '1'
            ? true
            : mayorParam === 'false' || mayorParam === '0'
              ? false
              : undefined
          : undefined,
      page: typeof p === 'number' && !Number.isNaN(p) ? p : undefined,
      pageSize: typeof ps === 'number' && !Number.isNaN(ps) ? ps : undefined,
      start: typeof start === 'string' && start !== '' && !Number.isNaN(Number(start)) ? Number(start) : undefined,
      end: typeof end === 'string' && end !== '' && !Number.isNaN(Number(end)) ? Number(end) : undefined,
    });
  }

  @Get(':beneficiarioId')
  async obtener(@Param('beneficiarioId') beneficiarioId: string) {
    const id = Number(beneficiarioId);
    if (Number.isNaN(id)) {
      throw new BadRequestException('beneficiarioId debe ser numérico');
    }
    return this.service.obtenerUno(id);
  }

  @Get('export/csv')
  async exportCsv(
    @Res() res: Response,
    @Query('proyectoId') proyectoId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('estadoBeneficiario') estadoBeneficiario?: string,
    @Query('q') q?: string,
    @Query('mayorEdad') mayorEdad?: string,
    @Query('es_mayor_edad') mayorEdadSnake?: string,
  ) {
    const proj = proyectoId !== undefined ? Number(proyectoId) : undefined;
    const mun = municipioId !== undefined ? Number(municipioId) : undefined;
    const dep = departamentoId !== undefined ? Number(departamentoId) : undefined;
    const est = estadoBeneficiario !== undefined ? Number(estadoBeneficiario) : undefined;
    const mayorParam = mayorEdad ?? mayorEdadSnake;

    const filters = {
      proyectoId: typeof proj === 'number' && !Number.isNaN(proj) ? proj : undefined,
      municipioId: typeof mun === 'number' && !Number.isNaN(mun) ? mun : undefined,
      departamentoId: typeof dep === 'number' && !Number.isNaN(dep) ? dep : undefined,
      estadoBeneficiario: typeof est === 'number' && !Number.isNaN(est) ? est : undefined,
      q,
      mayorEdad:
        typeof mayorParam === 'string'
          ? mayorParam === 'true' || mayorParam === '1'
            ? true
            : mayorParam === 'false' || mayorParam === '0'
              ? false
              : undefined
          : undefined,
    } as const;

    const csv = await this.service.exportCsv(filters as any);
    const filename = `beneficiarios-detalle-agg_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  }

  @Get('export/xlsx')
  async exportXlsx(
    @Res() res: Response,
    @Query('proyectoId') proyectoId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('estadoBeneficiario') estadoBeneficiario?: string,
    @Query('q') q?: string,
    @Query('mayorEdad') mayorEdad?: string,
    @Query('es_mayor_edad') mayorEdadSnake?: string,
  ) {
    const proj = proyectoId !== undefined ? Number(proyectoId) : undefined;
    const mun = municipioId !== undefined ? Number(municipioId) : undefined;
    const dep = departamentoId !== undefined ? Number(departamentoId) : undefined;
    const est = estadoBeneficiario !== undefined ? Number(estadoBeneficiario) : undefined;
    const mayorParam = mayorEdad ?? mayorEdadSnake;

    const filters = {
      proyectoId: typeof proj === 'number' && !Number.isNaN(proj) ? proj : undefined,
      municipioId: typeof mun === 'number' && !Number.isNaN(mun) ? mun : undefined,
      departamentoId: typeof dep === 'number' && !Number.isNaN(dep) ? dep : undefined,
      estadoBeneficiario: typeof est === 'number' && !Number.isNaN(est) ? est : undefined,
      q,
      mayorEdad:
        typeof mayorParam === 'string'
          ? mayorParam === 'true' || mayorParam === '1'
            ? true
            : mayorParam === 'false' || mayorParam === '0'
              ? false
              : undefined
          : undefined,
    } as const;

    const buffer = await this.service.exportXlsx(filters as any);
    const filename = `beneficiarios-detalle-agg_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
