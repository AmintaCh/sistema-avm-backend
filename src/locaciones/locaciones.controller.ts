import { BadRequestException, Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LocacionesService } from './locaciones.service';

@Controller('locaciones')
export class LocacionesController {
  constructor(private readonly svc: LocacionesService) {}

  @Get()
  async listar(@Query('municipioId') municipioId?: string) {
    if (typeof municipioId === 'string') {
      const id = parseInt(municipioId, 10);
      if (Number.isNaN(id)) {
        throw new BadRequestException('municipioId inválido');
      }
      return this.svc.listar(id);
    }
    return this.svc.listar();
  }

  @Post()
  async crear(@Body() body: { municipioId?: number; nombreLocacion?: string }) {
    return this.svc.crear({
      municipioId: body.municipioId as number,
      nombreLocacion: body.nombreLocacion as string,
    });
  }
}

