import { Controller, Get } from '@nestjs/common';
import { BeneficiariosDistribucionGeneroService } from './beneficiarios-distribucion-genero.service';

@Controller('beneficiarios-distribucion-genero')
export class BeneficiariosDistribucionGeneroController {
  constructor(private readonly service: BeneficiariosDistribucionGeneroService) {}

  @Get()
  async listar() {
    return this.service.listar();
  }
}

