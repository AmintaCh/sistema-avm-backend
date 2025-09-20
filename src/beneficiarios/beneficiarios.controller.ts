import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BeneficiariosService } from './beneficiarios.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';

@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Get()
  async listar(
    @Query('estadoId') estadoId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('q') q?: string,
    @Query('fechaInicioDesde') fechaInicioDesde?: string,
    @Query('fechaInicioHasta') fechaInicioHasta?: string,
    @Query('nombre') nombre?: string,
    @Query('numeroDocumento') numeroDocumento?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const est = typeof estadoId === 'string' ? Number(estadoId) : undefined;
    const mun = typeof municipioId === 'string' ? Number(municipioId) : undefined;
    const p = typeof page === 'string' ? Number(page) : undefined;
    const ps = typeof pageSize === 'string' ? Number(pageSize) : undefined;
    const dep = typeof departamentoId === 'string' ? Number(departamentoId) : undefined;
    return this.beneficiariosService.listar({
      estadoId: typeof est === 'number' && !Number.isNaN(est) ? est : undefined,
      municipioId: typeof mun === 'number' && !Number.isNaN(mun) ? mun : undefined,
      departamentoId: typeof dep === 'number' && !Number.isNaN(dep) ? dep : undefined,
      q,
      fechaInicioDesde,
      fechaInicioHasta,
      nombre,
      numeroDocumento,
      page: typeof p === 'number' && !Number.isNaN(p) ? p : undefined,
      pageSize: typeof ps === 'number' && !Number.isNaN(ps) ? ps : undefined,
      start: typeof start === 'string' && start !== '' && !Number.isNaN(Number(start)) ? Number(start) : undefined,
      end: typeof end === 'string' && end !== '' && !Number.isNaN(Number(end)) ? Number(end) : undefined,
    });
  }

  @Post()
  async crear(@Body() body: CreateBeneficiarioDto) {
    return this.beneficiariosService.crear(body);
  }

  @Get('por-id/:beneficiarioId')
  async obtenerPorBeneficiario(@Param('beneficiarioId') beneficiarioId: string) {
    const id = Number(beneficiarioId);
    if (Number.isNaN(id)) {
      throw new BadRequestException('beneficiarioId debe ser numérico');
    }
    return this.beneficiariosService.buscarPorBeneficiarioId(id);
  }
}
