import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { BeneficiosService } from './beneficios.service';
import { CreateBeneficioDto } from './dto/create-beneficio.dto';

@Controller('beneficios')
export class BeneficiosController {
  constructor(private readonly svc: BeneficiosService) {}

  @Get()
  async listar(
    @Query('q') q?: string,
    @Query('nombre') nombre?: string,
    @Query('proyectoId') proyectoId?: string,
  ) {
    const pid = typeof proyectoId === 'string' && proyectoId !== '' && !Number.isNaN(Number(proyectoId))
      ? Number(proyectoId)
      : undefined;
    return this.svc.listar({ q, nombre, proyectoId: pid });
  }

  @Get(':beneficioId')
  async obtener(@Param('beneficioId', ParseIntPipe) beneficioId: number) {
    return this.svc.buscarPorId(beneficioId);
  }

  @Post()
  async crear(@Body() body: CreateBeneficioDto) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Body inválido');
    }
    return this.svc.crear(body);
  }

  @Put(':beneficioId')
  async reemplazar(
    @Param('beneficioId', ParseIntPipe) beneficioId: number,
    @Body() body: CreateBeneficioDto,
  ) {
    return this.svc.reemplazar(beneficioId, body);
  }

  @Delete(':beneficioId')
  async eliminar(@Param('beneficioId', ParseIntPipe) beneficioId: number) {
    return this.svc.eliminar(beneficioId);
  }
}
