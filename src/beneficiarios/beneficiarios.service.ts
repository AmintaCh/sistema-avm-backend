import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async listar(filters?: {
    estadoId?: number;
    municipioId?: number;
    departamentoId?: number;
    q?: string;
    fechaInicioDesde?: string;
    fechaInicioHasta?: string;
    nombre?: string;
    numeroDocumento?: string;
    page?: number;
    pageSize?: number;
    start?: number;
    end?: number;
  }) {
    const qb = this.benefRepo
      .createQueryBuilder('b')
      .leftJoin('persona', 'p', 'p.persona_id = b.persona_id')
      .leftJoin('municipio', 'm', 'm.municipio_id = p.municipio_id')
      .leftJoin('departamento', 'd', 'd.departamento_id = m.departamento_id')
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
      .addSelect('d.departamento_id', 'departamentoId')
      .addSelect('d.nombre_departamento', 'nombreDepartamento')
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
    if (filters?.departamentoId !== undefined) {
      qb.andWhere('m.departamento_id = :departamentoId', { departamentoId: filters.departamentoId });
    }
    if (filters?.q) {
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        'p.numero_documento LIKE :q OR p.primer_nombre LIKE :q OR p.segundo_nombre LIKE :q OR p.tercer_nombre LIKE :q OR p.primer_apellido LIKE :q OR p.segundo_apellido LIKE :q',
        { q },
      );
    }
    if (filters?.nombre) {
      const n = `%${filters.nombre.trim()}%`;
      qb.andWhere(
        'p.primer_nombre LIKE :n OR p.segundo_nombre LIKE :n OR p.tercer_nombre LIKE :n OR p.primer_apellido LIKE :n OR p.segundo_apellido LIKE :n',
        { n },
      );
    }
    if (filters?.numeroDocumento) {
      const nd = `%${filters.numeroDocumento.trim()}%`;
      qb.andWhere('p.numero_documento LIKE :nd', { nd });
    }
    if (filters?.fechaInicioDesde) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.fechaInicioDesde)) {
        throw new BadRequestException('fechaInicioDesde debe tener formato YYYY-MM-DD');
      }
      qb.andWhere('b.fecha_inicio >= :fechaInicioDesde', { fechaInicioDesde: filters.fechaInicioDesde });
    }
    if (filters?.fechaInicioHasta) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.fechaInicioHasta)) {
        throw new BadRequestException('fechaInicioHasta debe tener formato YYYY-MM-DD');
      }
      qb.andWhere('b.fecha_inicio <= :fechaInicioHasta', { fechaInicioHasta: filters.fechaInicioHasta });
    }

    // Pagination: prefer start/end; else page/pageSize; else no pagination
    const useRange =
      typeof filters?.start === 'number' && Number.isFinite(filters.start) &&
      typeof filters?.end === 'number' && Number.isFinite(filters.end);
    const usePage =
      typeof filters?.page === 'number' && filters.page > 0 &&
      typeof filters?.pageSize === 'number' && filters.pageSize > 0;

    let startIdx: number | undefined;
    let endIdx: number | undefined;
    let page: number | undefined;
    let pageSize: number | undefined;

    if (useRange) {
      startIdx = Math.max(0, Math.floor(filters!.start!));
      endIdx = Math.max(startIdx, Math.floor(filters!.end!));
    } else if (usePage) {
      page = Math.floor(filters!.page!);
      pageSize = Math.min(Math.floor(filters!.pageSize!), 100);
    }

    const countQb = qb.clone();
    const total = await countQb.getCount();

    if (useRange) {
      const take = endIdx! - startIdx! + 1; // inclusive end
      qb.offset(startIdx!).limit(Math.max(0, take));
    } else if (usePage) {
      const skip = (page! - 1) * pageSize!;
      qb.offset(skip).limit(pageSize!);
    } // else: no pagination, return all

    const rows = await qb.getRawMany();
    const items = rows.map((r) => ({
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
          ? {
              municipioId: r.municipioId,
              nombreMunicipio: r.nombreMunicipio,
              departamento: r.departamentoId
                ? { departamentoId: r.departamentoId, nombreDepartamento: r.nombreDepartamento }
                : null,
            }
          : null,
        locacion: r.locacionId ? { locacionId: r.locacionId, nombreLocacion: r.nombreLocacion } : null,
      },
    }));

    if (useRange) {
      return { total, start: startIdx!, end: endIdx!, items };
    }
    // No page/pageSize in response (frontend no los requiere)
    return { total, items };
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

  async buscarPorBeneficiarioId(beneficiarioId: number) {
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
      .where('b.beneficiario_id = :beneficiarioId', { beneficiarioId })
      .orderBy('b.beneficiario_id', 'DESC');

    const r = await qb.getRawOne();
    if (!r) {
      throw new NotFoundException('No se encontró el beneficiario indicado');
    }

    return {
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
    };
  }
}
