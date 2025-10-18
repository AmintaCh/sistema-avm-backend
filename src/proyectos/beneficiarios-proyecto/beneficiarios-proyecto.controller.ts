import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ProyectosBeneficiariosService } from './beneficiarios-proyecto.service';
import { AddBeneficiarioProyectoDto } from '../dto/add-beneficiario-proyecto.dto';

@Controller('proyectos/:id/beneficiarios')
export class ProyectosBeneficiariosController {
  constructor(private readonly svc: ProyectosBeneficiariosService) {}

  @Post()
  async agregarBeneficiario(@Param('id') id: string, @Body() body: AddBeneficiarioProyectoDto) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }

    const beneficiarioId = Number(body?.beneficiarioId);
    if (!Number.isInteger(beneficiarioId)) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    const fechaIncorporacion = body?.fechaIncorporacion;
    if (typeof fechaIncorporacion !== 'string' || !fechaIncorporacion) {
      throw new BadRequestException('fechaIncorporacion es requerida');
    }
    const estadoId = Number(body?.estadoId);
    if (!Number.isInteger(estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    return this.svc.agregarBeneficiarioAProyecto({ proyectoId, beneficiarioId, fechaIncorporacion, estadoId });
  }

  @Get()
  async listarBeneficiarios(@Param('id') id: string) {
    const proyectoId = parseInt(id, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    return this.svc.listarBeneficiariosDeProyecto(proyectoId);
  }

  @Delete(':beneficiarioId')
  async eliminarBeneficiario(@Param('id') id: string, @Param('beneficiarioId') beneficiarioIdParam: string) {
    const proyectoId = parseInt(id, 10);
    const beneficiarioId = parseInt(beneficiarioIdParam, 10);
    if (Number.isNaN(proyectoId)) {
      throw new BadRequestException('id inválido');
    }
    if (Number.isNaN(beneficiarioId)) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    return this.svc.eliminarBeneficiarioDeProyecto(proyectoId, beneficiarioId);
  }
}
