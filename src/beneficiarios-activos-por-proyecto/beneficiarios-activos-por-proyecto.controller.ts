import { Controller, Get } from '@nestjs/common';
import { BeneficiariosActivosPorProyectoService } from './beneficiarios-activos-por-proyecto.service';

@Controller('beneficiarios-activos-por-proyecto')
export class BeneficiariosActivosPorProyectoController {
  constructor(private readonly service: BeneficiariosActivosPorProyectoService) {}

  @Get()
  async listar() {
    return this.service.listar();
  }
}

