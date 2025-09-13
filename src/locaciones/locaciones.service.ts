import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locacion } from '../entities/locacion.entity';
import { Municipio } from '../entities/municipio.entity';

interface CreateLocacionDto {
  municipioId: number;
  nombreLocacion: string;
}

@Injectable()
export class LocacionesService {
  constructor(
    @InjectRepository(Locacion) private readonly locacionRepo: Repository<Locacion>,
    @InjectRepository(Municipio) private readonly municipioRepo: Repository<Municipio>,
  ) {}

  async listar(municipioId?: number) {
    const qb = this.locacionRepo
      .createQueryBuilder('l')
      .leftJoin('municipio', 'm', 'm.municipio_id = l.municipio_id')
      .select('l.locacion_id', 'locacionId')
      .addSelect('l.nombre_locacion', 'nombreLocacion')
      .addSelect('m.municipio_id', 'municipioId')
      .addSelect('m.nombre_municipio', 'nombreMunicipio')
      .orderBy('l.nombre_locacion', 'ASC');

    if (typeof municipioId === 'number') {
      qb.where('l.municipio_id = :municipioId', { municipioId });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      locacionId: r.locacionId,
      nombreLocacion: r.nombreLocacion,
      municipio: { municipioId: r.municipioId, nombreMunicipio: r.nombreMunicipio },
    }));
  }

  async crear(dto: CreateLocacionDto) {
    if (!dto?.nombreLocacion) {
      throw new BadRequestException('nombre_locacion es requerido');
    }
    if (!dto?.municipioId) {
      throw new BadRequestException('municipio_id es requerido');
    }

    const municipio = await this.municipioRepo.findOne({ where: { municipioId: dto.municipioId } });
    if (!municipio) {
      throw new BadRequestException('municipio_id no existe');
    }

    const entity = this.locacionRepo.create({ nombreLocacion: dto.nombreLocacion, municipio });
    const saved = await this.locacionRepo.save(entity);

    return {
      locacionId: saved.locacionId,
      nombreLocacion: saved.nombreLocacion,
      municipio: { municipioId: municipio.municipioId, nombreMunicipio: municipio.nombreMunicipio },
    };
  }
}

