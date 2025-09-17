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
    @Query('q') q?: string,
  ) {
    const est = typeof estadoId === 'string' ? Number(estadoId) : undefined;
    const mun = typeof municipioId === 'string' ? Number(municipioId) : undefined;
    return this.beneficiariosService.listar({
      estadoId: typeof est === 'number' && !Number.isNaN(est) ? est : undefined,
      municipioId: typeof mun === 'number' && !Number.isNaN(mun) ? mun : undefined,
      q,
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
