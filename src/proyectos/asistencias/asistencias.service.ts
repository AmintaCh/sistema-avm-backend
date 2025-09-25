import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from '../../entities/actividad.entity';
import { Asistencia } from '../../entities/asistencia.entity';
import { Beneficiario } from '../../entities/beneficiario.entity';
import { CreateAsistenciaDto } from '../dto/create-asistencia.dto';

@Injectable()
export class ProyectosAsistenciasService {
  constructor(
    @InjectRepository(Actividad) private readonly actividadRepo: Repository<Actividad>,
    @InjectRepository(Asistencia) private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Beneficiario) private readonly beneficiarioRepo: Repository<Beneficiario>,
  ) {}

  async crearAsistencia(proyectoId: number, actividadId: number, dto: CreateAsistenciaDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }

    const actividad = await this.actividadRepo
      .createQueryBuilder('a')
      .where('a.actividad_id = :actividadId AND a.proyecto_id = :proyectoId', { actividadId, proyectoId })
      .getOne();
    if (!actividad) {
      throw new NotFoundException('No se encontró la actividad para el proyecto indicado');
    }

    const beneficiarioId = Number(dto.beneficiarioId);
    const beneficiario = await this.beneficiarioRepo.findOne({ where: { beneficiarioId } });
    if (!beneficiario) {
      throw new NotFoundException('No se encontró el beneficiario indicado');
    }

    // Evitar duplicados: una asistencia por actividad y beneficiario
    const yaExiste = await this.asistenciaRepo
      .createQueryBuilder('as')
      .where('as.actividad_id = :actividadId AND as.beneficiario_id = :beneficiarioId', {
        actividadId,
        beneficiarioId,
      })
      .getExists();
    if (yaExiste) {
      throw new BadRequestException(
        'Ya existe una asistencia para este beneficiario en la actividad indicada',
      );
    }

    // Acepta 'YYYY-MM-DD' o ISO datetime 'YYYY-MM-DDThh:mm:ss(...)'
    if (!dto.fechaRegistro || typeof dto.fechaRegistro !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(dto.fechaRegistro)) {
      throw new BadRequestException('fechaRegistro debe tener formato YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss');
    }
    if (!Number.isInteger(dto.estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    // Normaliza a 'YYYY-MM-DD' si viene con tiempo (ISO)
    const fechaNormalizada = dto.fechaRegistro.split('T')[0];
    const entity = this.asistenciaRepo.create({
      actividad,
      beneficiario,
      fechaRegistro: fechaNormalizada,
      estadoId: dto.estadoId,
      observaciones: dto.observaciones ?? null,
    });
    const saved = await this.asistenciaRepo.save(entity);
    return {
      asistenciaId: saved.asistenciaId,
      actividadId,
      beneficiarioId,
      fechaRegistro: saved.fechaRegistro,
      estadoId: saved.estadoId,
      observaciones: saved.observaciones ?? null,
    };
  }

  async listarAsistenciasDeActividad(proyectoId: number, actividadId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }

    const existe = await this.actividadRepo
      .createQueryBuilder('a')
      .where('a.actividad_id = :actividadId AND a.proyecto_id = :proyectoId', { actividadId, proyectoId })
      .getExists();
    if (!existe) {
      throw new NotFoundException('No se encontró la actividad para el proyecto indicado');
    }

    const rows = await this.asistenciaRepo
      .createQueryBuilder('as')
      .innerJoin('beneficiario', 'b', 'b.beneficiario_id = as.beneficiario_id')
      .leftJoin('persona', 'p', 'p.persona_id = b.persona_id')
      .leftJoin('municipio', 'm', 'm.municipio_id = p.municipio_id')
      .leftJoin('departamento', 'd', 'd.departamento_id = m.departamento_id')
      .select('as.asistencia_id', 'asistenciaId')
      .addSelect('as.actividad_id', 'actividadId')
      .addSelect('as.beneficiario_id', 'beneficiarioId')
      .addSelect('as.fecha_registro', 'fechaRegistro')
      .addSelect('as.estado_id', 'estadoId')
      .addSelect('as.observaciones', 'observaciones')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.segundo_nombre', 'segundoNombre')
      .addSelect('p.tercer_nombre', 'tercerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
      .addSelect('p.segundo_apellido', 'segundoApellido')
      .addSelect('m.nombre_municipio', 'nombreMunicipio')
      .addSelect('d.nombre_departamento', 'nombreDepartamento')
      .where('as.actividad_id = :actividadId', { actividadId })
      .orderBy('as.fecha_registro', 'DESC')
      .addOrderBy('as.asistencia_id', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      asistenciaId: r.asistenciaId,
      actividadId: r.actividadId,
      beneficiarioId: r.beneficiarioId,
      fechaRegistro: r.fechaRegistro,
      estadoId: r.estadoId,
      observaciones: r.observaciones,
      beneficiario: {
        beneficiarioId: r.beneficiarioId,
        persona: {
          primerNombre: r.primerNombre ?? null,
          segundoNombre: r.segundoNombre ?? null,
          tercerNombre: r.tercerNombre ?? null,
          primerApellido: r.primerApellido ?? null,
          segundoApellido: r.segundoApellido ?? null,
          departamento: r.nombreDepartamento ?? null,
          municipio: r.nombreMunicipio ?? null,
        },
      },
    }));
  }

  async crearAsistenciasEnLote(
    proyectoId: number,
    actividadId: number,
    payload: {
      items: Array<{ beneficiarioId: number; fechaRegistro: string; estadoId: number; observaciones?: string | null }>;
      skipExistentes?: boolean;
      upsert?: boolean;
    },
  ) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('items es requerido y no puede estar vacío');
    }

    const actividad = await this.actividadRepo
      .createQueryBuilder('a')
      .where('a.actividad_id = :actividadId AND a.proyecto_id = :proyectoId', { actividadId, proyectoId })
      .getOne();
    if (!actividad) {
      throw new NotFoundException('No se encontró la actividad para el proyecto indicado');
    }

    // Acepta 'YYYY-MM-DD' o ISO datetime 'YYYY-MM-DDThh:mm:ss(...)'
    const dateOrIsoRe = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
    const sanitized = payload.items.map((it, idx) => {
      const beneficiarioId = Number(it?.beneficiarioId);
      const estadoId = Number(it?.estadoId);
      const fechaRegistroRaw = it?.fechaRegistro;
      if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
        throw new BadRequestException(`items[${idx}].beneficiarioId inválido`);
      }
      if (typeof fechaRegistroRaw !== 'string' || !dateOrIsoRe.test(fechaRegistroRaw)) {
        throw new BadRequestException(`items[${idx}].fechaRegistro inválido (YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss)`);
      }
      const fechaRegistro = fechaRegistroRaw.split('T')[0];
      if (!Number.isInteger(estadoId)) {
        throw new BadRequestException(`items[${idx}].estadoId inválido`);
      }
      const observaciones = it?.observaciones ?? null;
      return { beneficiarioId, fechaRegistro, estadoId, observaciones };
    });

    const seen = new Set<number>();
    const deduped: typeof sanitized = [];
    const internosOmitidos: number[] = [];
    for (const s of sanitized) {
      if (seen.has(s.beneficiarioId)) {
        internosOmitidos.push(s.beneficiarioId);
        continue;
      }
      seen.add(s.beneficiarioId);
      deduped.push(s);
    }

    const beneficiarioIds = deduped.map((s) => s.beneficiarioId);
    const beneficiarios = await this.beneficiarioRepo
      .createQueryBuilder('b')
      .where('b.beneficiario_id IN (:...ids)', { ids: beneficiarioIds })
      .getMany();
    const encontrados = new Set(beneficiarios.map((b) => b.beneficiarioId));
    const faltantes = beneficiarioIds.filter((id) => !encontrados.has(id));
    if (faltantes.length > 0) {
      throw new NotFoundException(`No se encontraron beneficiarios: ${faltantes.join(', ')}`);
    }

    const existentesRows = await this.asistenciaRepo
      .createQueryBuilder('as')
      .select('as.beneficiario_id', 'beneficiarioId')
      .where('as.actividad_id = :actividadId AND as.beneficiario_id IN (:...ids)', { actividadId, ids: beneficiarioIds })
      .getRawMany<{ beneficiarioId: number }>();
    const existentesSet = new Set(existentesRows.map((r) => Number(r.beneficiarioId)));

    const upsert = true;
    const skipExistentes = payload.skipExistentes !== false; // sin efecto cuando upsert es true
    if (!upsert && !skipExistentes && existentesSet.size > 0) {
      throw new BadRequestException(
        `Ya existen asistencias para beneficiarios en esta actividad: ${[...existentesSet].join(', ')}`,
      );
    }

    const aInsertar = deduped.filter((s) => !existentesSet.has(s.beneficiarioId));
    const aActualizar = upsert ? deduped.filter((s) => existentesSet.has(s.beneficiarioId)) : [];

    const benefPorId = new Map(beneficiarios.map((b) => [b.beneficiarioId, b] as const));

    let insertados = 0;
    let resultadosInsert: Array<{
      asistenciaId: number;
      actividadId: number;
      beneficiarioId: number;
      fechaRegistro: string;
      estadoId: number;
      observaciones: string | null;
    }> = [];
    if (aInsertar.length > 0) {
      const entidades = aInsertar.map((s) =>
        this.asistenciaRepo.create({
          actividad,
          beneficiario: benefPorId.get(s.beneficiarioId)!,
          fechaRegistro: s.fechaRegistro,
          estadoId: s.estadoId,
          observaciones: s.observaciones ?? null,
        }),
      );
      const saved = await this.asistenciaRepo.save(entidades);
      insertados = saved.length;
      resultadosInsert = saved.map((s) => ({
        asistenciaId: s.asistenciaId,
        actividadId,
        beneficiarioId: s.beneficiario.beneficiarioId,
        fechaRegistro: s.fechaRegistro,
        estadoId: s.estadoId,
        observaciones: s.observaciones ?? null,
      }));
    }

    let actualizados = 0;
    let resultadosUpdate: Array<{
      asistenciaId: number;
      actividadId: number;
      beneficiarioId: number;
      fechaRegistro: string;
      estadoId: number;
      observaciones: string | null;
    }> = [];
    if (aActualizar.length > 0) {
      const mapDatos = new Map(aActualizar.map((s) => [s.beneficiarioId, s] as const));
      const existentes = await this.asistenciaRepo
        .createQueryBuilder('as')
        .leftJoinAndSelect('as.beneficiario', 'b')
        .where('as.actividad_id = :actividadId AND as.beneficiario_id IN (:...ids)', {
          actividadId,
          ids: aActualizar.map((s) => s.beneficiarioId),
        })
        .getMany();
      for (const e of existentes) {
        const datos = mapDatos.get(e.beneficiario.beneficiarioId);
        if (!datos) continue;
        e.fechaRegistro = datos.fechaRegistro;
        e.estadoId = datos.estadoId;
        e.observaciones = datos.observaciones ?? null;
      }
      const savedUpd = await this.asistenciaRepo.save(existentes);
      actualizados = savedUpd.length;
      resultadosUpdate = savedUpd.map((s) => ({
        asistenciaId: s.asistenciaId,
        actividadId,
        beneficiarioId: s.beneficiario.beneficiarioId,
        fechaRegistro: s.fechaRegistro,
        estadoId: s.estadoId,
        observaciones: s.observaciones ?? null,
      }));
    }

    const omitidosExistentes = upsert ? [] : [...existentesSet];
    const omitidosInternos = internosOmitidos;
    return {
      total: sanitized.length,
      insertados,
      actualizados,
      omitidos: omitidosInternos.length + omitidosExistentes.length,
      omitidosInternos,
      omitidosExistentes,
      resultados: [...resultadosInsert, ...resultadosUpdate],
    };
  }
}
