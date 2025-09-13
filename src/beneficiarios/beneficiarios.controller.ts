import { Body, Controller, Post } from '@nestjs/common';
import { BeneficiariosService } from './beneficiarios.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';

@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Post()
  async crear(@Body() body: CreateBeneficiarioDto) {
    return this.beneficiariosService.crear(body);
  }
}

