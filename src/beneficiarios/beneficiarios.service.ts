import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Beneficiario } from '../entities/beneficiario.entity';
import { Persona } from '../entities/persona.entity';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';

@Injectable()
export class BeneficiariosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Beneficiario) private readonly benefRepo: Repository<Beneficiario>,
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
  ) {}

  async listar(filters?: { estadoId?: number; municipioId?: number; q?: string }) {
    const qb = this.benefRepo
      .createQueryBuilder('b')
      .leftJoin('persona', 'p', 'p.persona_id = b.persona_id')
      .leftJoin('municipio', 'm', 'm.municipio_id = p.municipio_id')
      .leftJoin('locacion', 'l', 'l.locacion_id = p.locacion_id')
      .select('b.beneficiario_id', 'beneficiarioId')
      .addSelect('b.estado_id', 'estadoId')
      .addSelect('b.fecha_inicio', 'fechaInicio')
      .addSelect('b.latitud', 'latitud')
      .addSelect('b.longitud', 'longitud')
      .addSelect('p.persona_id', 'personaId')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.segundo_nombre', 'segundoNombre')
      .addSelect('p.tercer_nombre', 'tercerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
      .addSelect('p.segundo_apellido', 'segundoApellido')
      .addSelect('p.tipo_documento', 'tipoDocumento')
      .addSelect('p.numero_documento', 'numeroDocumento')
      .addSelect('p.telefono', 'telefono')
      .addSelect('m.municipio_id', 'municipioId')
      .addSelect('m.nombre_municipio', 'nombreMunicipio')
      .addSelect('l.locacion_id', 'locacionId')
      .addSelect('l.nombre_locacion', 'nombreLocacion')
      .orderBy('p.primer_apellido', 'ASC')
      .addOrderBy('p.primer_nombre', 'ASC');

    if (filters?.estadoId !== undefined) {
      qb.andWhere('b.estado_id = :estadoId', { estadoId: filters.estadoId });
    }
    if (filters?.municipioId !== undefined) {
      qb.andWhere('p.municipio_id = :municipioId', { municipioId: filters.municipioId });
    }
    if (filters?.q) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        'p.numero_documento LIKE :q OR p.primer_nombre LIKE :q OR p.segundo_nombre LIKE :q OR p.tercer_nombre LIKE :q OR p.primer_apellido LIKE :q OR p.segundo_apellido LIKE :q',
        { q },
      );
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      beneficiarioId: r.beneficiarioId,
      estadoId: r.estadoId,
      fechaInicio: r.fechaInicio,
      latitud: r.latitud,
      longitud: r.longitud,
      persona: {
        personaId: r.personaId,
        primerNombre: r.primerNombre,
        segundoNombre: r.segundoNombre,
        tercerNombre: r.tercerNombre,
        primerApellido: r.primerApellido,
        segundoApellido: r.segundoApellido,
        tipoDocumento: r.tipoDocumento,
        numeroDocumento: r.numeroDocumento,
        telefono: r.telefono,
        municipio: r.municipioId
          ? { municipioId: r.municipioId, nombreMunicipio: r.nombreMunicipio }
          : null,
        locacion: r.locacionId ? { locacionId: r.locacionId, nombreLocacion: r.nombreLocacion } : null,
      },
    }));
  }

  async crear(dto: CreateBeneficiarioDto) {
    // Validaciones mínimas
    if (!dto.primerNombre || !dto.primerApellido) {
      throw new BadRequestException('primer_nombre y primer_apellido son requeridos');
    }
    if (!dto.tipoDocumento || !dto.numeroDocumento) {
      throw new BadRequestException('tipo_documento y numero_documento son requeridos');
    }
    if (!dto.municipioId) {
      throw new BadRequestException('municipio_id es requerido');
    }
    if (!dto.estadoId && dto.estadoId !== 0) {
      throw new BadRequestException('estado_id es requerido');
    }
    if (!dto.fechaInicio) {
      throw new BadRequestException('fecha_inicio es requerido');
    }

    // Unicidad del documento
    const docExistente = await this.personaRepo.findOne({ where: { numeroDocumento: dto.numeroDocumento } });
    if (docExistente) {
      throw new BadRequestException('El numero_documento ya existe');
    }

    return this.dataSource.transaction(async (manager) => {
      const persona = manager.create(Persona, {
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre ?? null,
        tercerNombre: dto.tercerNombre ?? null,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido ?? null,
        fechaNacimiento: dto.fechaNacimiento,
        genero: dto.genero,
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        direccionDetalle: dto.direccionDetalle ?? null,
        municipioId: dto.municipioId,
        locacionId: dto.locacionId ?? null,
        telefono: dto.telefono ?? null,
      });
      const personaGuardada = await manager.save(Persona, persona);

      const beneficiario = manager.create(Beneficiario, {
        persona: personaGuardada,
        estadoId: dto.estadoId,
        fechaInicio: dto.fechaInicio,
        latitud: dto.latitud,
        longitud: dto.longitud,
      });
      const saved = await manager.save(Beneficiario, beneficiario);

      return {
        beneficiarioId: saved.beneficiarioId,
        personaId: personaGuardada.personaId,
        estadoId: saved.estadoId,
        fechaInicio: saved.fechaInicio,
        latitud: saved.latitud,
        longitud: saved.longitud,
      };
    });
  }
}
