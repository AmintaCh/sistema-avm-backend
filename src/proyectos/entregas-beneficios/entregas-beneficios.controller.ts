import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { ProyectosEntregasBeneficiosService } from './entregas-beneficios.service';
import { CreateEntregasBeneficioBatchDto } from '../dto/create-entregas-beneficio-batch.dto';

@Controller('proyectos/:id/beneficios/:beneficioId/entregas')
export class ProyectosEntregasBeneficiosController {
  constructor(private readonly svc: ProyectosEntregasBeneficiosService) {}

  @Post('lote')
  async crearEntregasLote(
    @Param('id') idParam: string,
    @Param('beneficioId') beneficioIdParam: string,
    @Body() body: CreateEntregasBeneficioBatchDto,
  ) {
    const proyectoId = parseInt(idParam, 10);
    const beneficioId = parseInt(beneficioIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(beneficioId)) {
      throw new BadRequestException('beneficioId inválido');
    }
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('items es requerido y no puede estar vacío');
    }
    return this.svc.crearEntregasEnLote(proyectoId, beneficioId, body);
  }
}

