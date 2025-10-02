import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Beneficio } from '../../entities/beneficio.entity';
import { BeneficioProyecto } from '../../entities/beneficio-proyecto.entity';
import { Beneficiario } from '../../entities/beneficiario.entity';
import { EntregaBeneficio } from '../../entities/entrega-beneficio.entity';
import { CreateEntregasBeneficioBatchDto } from '../dto/create-entregas-beneficio-batch.dto';
import { EventoEntrega } from '../../entities/evento-entrega.entity';
import { Usuario } from '../../entities/usuario.entity';

interface EntregaSanitizada {
  beneficiarioId: number;
  fechaEntrega: string;
  cantidad: string; // Normalizada a 2 decimales
  estadoId: number;
  observaciones: string | null;
}

@Injectable()
export class ProyectosEntregasBeneficiosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(Beneficio) private readonly beneficioRepo: Repository<Beneficio>,
    @InjectRepository(BeneficioProyecto)
    private readonly beneficioProyectoRepo: Repository<BeneficioProyecto>,
    @InjectRepository(Beneficiario) private readonly beneficiarioRepo: Repository<Beneficiario>,
    @InjectRepository(EntregaBeneficio)
    private readonly entregaRepo: Repository<EntregaBeneficio>,
    @InjectRepository(EventoEntrega)
    private readonly eventoRepo: Repository<EventoEntrega>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async crearEntregasEnLote(
    proyectoId: number,
    beneficioId: number,
    payload: CreateEntregasBeneficioBatchDto,
  ) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      throw new BadRequestException('beneficioId inválido');
    }
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('items es requerido y no puede estar vacío');
    }

    const [proyecto, beneficio] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.beneficioRepo.findOne({ where: { beneficioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!beneficio) {
      throw new NotFoundException('No se encontró el beneficio indicado');
    }

    const beneficioAsignado = await this.beneficioProyectoRepo.findOne({
      where: { proyectoId, beneficioId },
    });
    if (!beneficioAsignado) {
      throw new BadRequestException('El beneficio no está asignado al proyecto indicado');
    }

    const dateOrIsoRe = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

    // Si viene eventoId, validar que exista y pertenezca al proyecto
    let evento: EventoEntrega | null = null;
    if (payload.eventoId != null) {
      const eventoId = Number(payload.eventoId);
      if (!Number.isInteger(eventoId) || eventoId <= 0) {
        throw new BadRequestException('eventoId inválido');
      }
      evento = await this.eventoRepo
        .createQueryBuilder('ev')
        .where('ev.evento_id = :eventoId AND ev.proyecto_id = :proyectoId', { eventoId, proyectoId })
        .getOne();
      if (!evento) {
        throw new NotFoundException('No se encontró el evento indicado para el proyecto');
      }
    }

    // Si viene entregadoPor, validar usuario
    let entregadoPor: Usuario | null = null;
    if (payload.entregadoPor != null) {
      const entregadoPorId = Number(payload.entregadoPor);
      if (!Number.isInteger(entregadoPorId) || entregadoPorId <= 0) {
        throw new BadRequestException('entregadoPor inválido');
      }
      entregadoPor = await this.usuarioRepo.findOne({ where: { usuarioId: entregadoPorId } });
      if (!entregadoPor) {
        throw new NotFoundException('No se encontró el usuario entregadoPor indicado');
      }
    }
    const sanitized: EntregaSanitizada[] = payload.items.map((item, idx) => {
      const beneficiarioId = Number(item?.beneficiarioId);
      if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
        throw new BadRequestException(`items[${idx}].beneficiarioId inválido`);
      }

      const fechaRaw = item?.fechaEntrega;
      if (typeof fechaRaw !== 'string' || !dateOrIsoRe.test(fechaRaw)) {
        throw new BadRequestException(
          `items[${idx}].fechaEntrega inválido (YYYY-MM-DD o ISO YYYY-MM-DDThh:mm:ss)`,
        );
      }
      const fechaEntrega = fechaRaw.split('T')[0];

      const cantidadRaw = Number(item?.cantidad);
      if (!Number.isFinite(cantidadRaw) || cantidadRaw <= 0) {
        throw new BadRequestException(`items[${idx}].cantidad debe ser numérica y mayor a 0`);
      }
      const cantidadNormalizada = Math.round(cantidadRaw * 100) / 100;
      const cantidad = cantidadNormalizada.toFixed(2);

      const estadoId = Number(item?.estadoId);
      if (!Number.isInteger(estadoId)) {
        throw new BadRequestException(`items[${idx}].estadoId inválido`);
      }

      const observaciones =
        item?.observaciones == null
          ? null
          : typeof item.observaciones === 'string'
          ? item.observaciones.trim() || null
          : (() => {
              throw new BadRequestException(`items[${idx}].observaciones debe ser string`);
            })();

      return { beneficiarioId, fechaEntrega, cantidad, estadoId, observaciones };
    });

    const seen = new Set<string>();
    const deduped: EntregaSanitizada[] = [];
    const omitidosInternos: Array<{ beneficiarioId: number; fechaEntrega: string }> = [];
    for (const row of sanitized) {
      const key = `${row.beneficiarioId}|${row.fechaEntrega}`;
      if (seen.has(key)) {
        omitidosInternos.push({ beneficiarioId: row.beneficiarioId, fechaEntrega: row.fechaEntrega });
        continue;
      }
      seen.add(key);
      deduped.push(row);
    }

    const beneficiarioIds = deduped.map((row) => row.beneficiarioId);
    const beneficiarios = await this.beneficiarioRepo
      .createQueryBuilder('b')
      .innerJoin('beneficiario_proyecto', 'bp', 'bp.beneficiario_id = b.beneficiario_id')
      .where('bp.proyecto_id = :proyectoId', { proyectoId })
      .andWhere('b.beneficiario_id IN (:...ids)', { ids: beneficiarioIds })
      .getMany();
    const encontrados = new Set(beneficiarios.map((b) => b.beneficiarioId));
    const faltantes = beneficiarioIds.filter((id) => !encontrados.has(id));
    if (faltantes.length > 0) {
      throw new NotFoundException(
        `Los beneficiarios no pertenecen al proyecto indicado: ${faltantes.join(', ')}`,
      );
    }

    const fechas = [...new Set(deduped.map((row) => row.fechaEntrega))];
    const existentes = await this.entregaRepo
      .createQueryBuilder('en')
      .leftJoinAndSelect('en.beneficiario', 'b')
      .where('en.beneficio_id = :beneficioId', { beneficioId })
      .andWhere('en.proyecto_id = :proyectoId', { proyectoId })
      .andWhere('en.beneficiario_id IN (:...ids)', { ids: beneficiarioIds })
      .andWhere('en.fecha_entrega IN (:...fechas)', { fechas })
      .getMany();
    const existentesMap = new Map<string, EntregaBeneficio>();
    for (const ex of existentes) {
      const key = `${ex.beneficiario.beneficiarioId}|${ex.fechaEntrega}`;
      existentesMap.set(key, ex);
    }

    const upsert = payload.upsert !== false;
    const skipExistentes = payload.skipExistentes !== false;
    if (!upsert && !skipExistentes && existentesMap.size > 0) {
      const conflicts = [...existentesMap.keys()]
        .map((k) => k.replace('|', ' -> '))
        .join(', ');
      throw new BadRequestException(`Ya existen entregas registradas: ${conflicts}`);
    }

    const aInsertar = deduped.filter((row) => !existentesMap.has(`${row.beneficiarioId}|${row.fechaEntrega}`));
    const aActualizar = upsert
      ? deduped.filter((row) => existentesMap.has(`${row.beneficiarioId}|${row.fechaEntrega}`))
      : [];

    const benefPorId = new Map(beneficiarios.map((b) => [b.beneficiarioId, b] as const));

    let insertados = 0;
    let resultadosInsert: Array<{
      entregaId: number;
      beneficioId: number;
      beneficiarioId: number;
      fechaEntrega: string;
      cantidad: number;
      estadoId: number;
      observaciones: string | null;
    }> = [];
    if (aInsertar.length > 0) {
      const nuevasEntregas = aInsertar.map((row) =>
        this.entregaRepo.create({
          proyecto,
          beneficio,
          beneficiario: benefPorId.get(row.beneficiarioId)!,
          fechaEntrega: row.fechaEntrega,
          cantidad: row.cantidad,
          estadoId: row.estadoId,
          observaciones: row.observaciones,
          evento: evento ?? null,
          entregadoPor: entregadoPor ?? null,
        }),
      );
      const guardadas = await this.entregaRepo.save(nuevasEntregas);
      insertados = guardadas.length;
      resultadosInsert = guardadas.map((ent) => ({
        entregaId: ent.entregaId,
        proyectoId: proyectoId,
        beneficioId,
        beneficiarioId: ent.beneficiario.beneficiarioId,
        fechaEntrega: ent.fechaEntrega,
        cantidad: Number(ent.cantidad),
        estadoId: ent.estadoId,
        observaciones: ent.observaciones ?? null,
        eventoId: ent.evento ? ent.evento.eventoId : null,
        entregadoPor: ent.entregadoPor ? ent.entregadoPor.usuarioId : null,
      }));
    }

    let actualizados = 0;
    let resultadosUpdate: Array<{
      entregaId: number;
      beneficioId: number;
      beneficiarioId: number;
      fechaEntrega: string;
      cantidad: number;
      estadoId: number;
      observaciones: string | null;
    }> = [];
    if (aActualizar.length > 0) {
      for (const row of aActualizar) {
        const key = `${row.beneficiarioId}|${row.fechaEntrega}`;
        const entity = existentesMap.get(key);
        if (!entity) {
          continue;
        }
        entity.cantidad = row.cantidad;
        entity.estadoId = row.estadoId;
        entity.observaciones = row.observaciones;
        if (evento) entity.evento = evento;
        if (entregadoPor) entity.entregadoPor = entregadoPor;
      }
      const guardadas = await this.entregaRepo.save(aActualizar.map((row) => existentesMap.get(`${row.beneficiarioId}|${row.fechaEntrega}`)!));
      actualizados = guardadas.length;
      resultadosUpdate = guardadas.map((ent) => ({
        entregaId: ent.entregaId,
        proyectoId: proyectoId,
        beneficioId,
        beneficiarioId: ent.beneficiario.beneficiarioId,
        fechaEntrega: ent.fechaEntrega,
        cantidad: Number(ent.cantidad),
        estadoId: ent.estadoId,
        observaciones: ent.observaciones ?? null,
        eventoId: ent.evento ? ent.evento.eventoId : null,
        entregadoPor: ent.entregadoPor ? ent.entregadoPor.usuarioId : null,
      }));
    }

    const omitidosExistentes = upsert
      ? []
      : [...existentesMap.keys()].map((key) => {
          const [beneficiarioId, fechaEntrega] = key.split('|');
          return { beneficiarioId: Number(beneficiarioId), fechaEntrega };
        });

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
