import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ProyectosEntregasBeneficiosService } from './entregas-beneficios.service';

// Lista entregas por proyecto y evento, sin exigir beneficio en la ruta
@Controller('proyectos/:id/eventos-entrega/:eventoId/entregas')
export class ProyectosEntregasPorEventoController {
  constructor(private readonly svc: ProyectosEntregasBeneficiosService) {}

  @Get()
  async listarPorEvento(
    @Param('id') idParam: string,
    @Param('eventoId') eventoIdParam: string,
    @Query('beneficiarioId') beneficiarioIdParam?: string,
    @Query('beneficioId') beneficioIdParam?: string,
  ) {
    const proyectoId = parseInt(idParam, 10);
    const eventoId = parseInt(eventoIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(eventoId)) {
      throw new BadRequestException('eventoId inválido');
    }

    let beneficiarioId: number | undefined;
    if (beneficiarioIdParam != null) {
      const n = parseInt(beneficiarioIdParam, 10);
      if (Number.isNaN(n) || n <= 0) throw new BadRequestException('beneficiarioId inválido');
      beneficiarioId = n;
    }

    let beneficioId: number | undefined;
    if (beneficioIdParam != null) {
      const n = parseInt(beneficioIdParam, 10);
      if (Number.isNaN(n) || n <= 0) throw new BadRequestException('beneficioId inválido');
      beneficioId = n;
    }

    return this.svc.listarEntregasPorEvento(proyectoId, eventoId, { beneficiarioId, beneficioId });
  }
}

