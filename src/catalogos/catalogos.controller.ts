import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly svc: CatalogosService) {}

  @Get('roles')
  roles() {
    return this.svc.roles();
  }

  @Get('departamentos')
  departamentos() {
    return this.svc.departamentos();
  }

  @Get('municipios')
  municipios(@Query('departamentoId') departamentoId?: string) {
    if (typeof departamentoId === 'string') {
      const id = parseInt(departamentoId, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestException('departamentoId inválido');
      }
      return this.svc.municipios(id);
    }
    return this.svc.municipios();
  }
}
