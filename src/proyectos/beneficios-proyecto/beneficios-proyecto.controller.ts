import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ProyectosBeneficiosService } from './beneficios-proyecto.service';
import { AddBeneficioProyectoDto } from '../dto/add-beneficio-proyecto.dto';

@Controller('proyectos/:id/beneficios')
export class ProyectosBeneficiosController {
  constructor(private readonly svc: ProyectosBeneficiosService) {}

  @Get()
  async listar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.listarBeneficiosDeProyecto(id);
  }

  @Post()
  async agregarBeneficio(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddBeneficioProyectoDto,
  ) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Body inválido');
    }
    const beneficioId = Number(body.beneficioId);
    if (!Number.isInteger(beneficioId)) {
      throw new BadRequestException('beneficioId inválido');
    }
    return this.svc.agregarBeneficioAProyecto(id, beneficioId);
  }
}
