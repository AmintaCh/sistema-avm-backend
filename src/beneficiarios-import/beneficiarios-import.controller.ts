import { BadRequestException, Body, Controller, Get, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BeneficiariosImportService } from './beneficiarios-import.service';

@Controller('beneficiarios/import')
export class BeneficiariosImportController {
  constructor(private readonly service: BeneficiariosImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @UploadedFile() file?: any,
    @Query('proyectoId') proyectoId?: string,
    @Query('municipioId') municipioId?: string,
    @Query('mode') mode?: 'insert' | 'upsert' | 'skip-duplicates',
    @Query('dryRun') dryRun?: string,
    @Query('strict') strict?: string,
    @Query('allowPartial') allowPartial?: string,
  ) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Se requiere un archivo CSV o XLSX en el campo "file"');
    }

    const pid = proyectoId !== undefined && proyectoId !== '' && !Number.isNaN(Number(proyectoId)) ? Number(proyectoId) : undefined;
    const munid = municipioId !== undefined && municipioId !== '' && !Number.isNaN(Number(municipioId)) ? Number(municipioId) : undefined;
    const isDryRun = dryRun === '1' || dryRun === 'true';
    const importMode: 'insert' | 'upsert' | 'skip-duplicates' = mode ?? 'upsert';
    const isStrict = allowPartial === '1' || allowPartial === 'true' ? false : !(strict === '0' || strict === 'false');

    return this.service.importarArchivo({
      filename: file.originalname,
      buffer: file.buffer,
      proyectoId: pid,
      municipioId: munid,
      mode: importMode,
      dryRun: isDryRun,
      strict: isStrict,
    });
  }

  @Get('template')
  async descargarTemplate(@Res() res: Response) {
    const buffer = await this.service.generarTemplateXlsx();
    const filename = `template_beneficiarios_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
