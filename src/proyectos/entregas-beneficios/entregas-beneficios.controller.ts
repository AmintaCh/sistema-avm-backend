import { BadRequestException, Body, Controller, Param, Post, Get, Query } from '@nestjs/common';
import { ProyectosEntregasBeneficiosService } from './entregas-beneficios.service';
import { CreateEntregasBeneficioBatchDto } from '../dto/create-entregas-beneficio-batch.dto';

@Controller('proyectos/:id/beneficios/:beneficioId/entregas')
export class ProyectosEntregasBeneficiosController {
  constructor(private readonly svc: ProyectosEntregasBeneficiosService) {}

  @Get()
  async listar(
    @Param('id') idParam: string,
    @Param('beneficioId') beneficioIdParam: string,
    @Query('eventoId') eventoIdParam?: string,
    @Query('beneficiarioId') beneficiarioIdParam?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const proyectoId = parseInt(idParam, 10);
    const beneficioId = parseInt(beneficioIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(beneficioId)) {
      throw new BadRequestException('beneficioId inválido');
    }

    let eventoId: number | undefined;
    if (eventoIdParam != null) {
      const n = parseInt(eventoIdParam, 10);
      if (Number.isNaN(n) || n <= 0) {
        throw new BadRequestException('eventoId inválido');
      }
      eventoId = n;
    }

    let beneficiarioId: number | undefined;
    if (beneficiarioIdParam != null) {
      const n = parseInt(beneficiarioIdParam, 10);
      if (Number.isNaN(n) || n <= 0) {
        throw new BadRequestException('beneficiarioId inválido');
      }
      beneficiarioId = n;
    }

    return this.svc.listarEntregas(proyectoId, beneficioId, { eventoId, beneficiarioId, desde, hasta });
  }

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
