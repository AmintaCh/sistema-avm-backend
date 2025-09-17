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

  @Get('estados')
  estados(@Query('tipoEstado') tipoEstado?: string) {
    if (typeof tipoEstado === 'string') {
      const t = tipoEstado.trim();
      if (t.length > 1) {
        throw new BadRequestException('tipoEstado debe ser una sola letra');
      }
      if (t.length === 1 && !/^[A-Za-z]$/.test(t)) {
        throw new BadRequestException('tipoEstado inválido');
      }
      return this.svc.estados(t);
    }
    return this.svc.estados();
  }
}
