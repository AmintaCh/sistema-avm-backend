import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { Usuario } from '../entities/usuario.entity';
import { BeneficiarioProyecto } from '../entities/beneficiario-proyecto.entity';
import { Beneficiario } from '../entities/beneficiario.entity';
import { Actividad } from '../entities/actividad.entity';
import { Asistencia } from '../entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(UsuarioProyecto) private readonly usuarioProyectoRepo: Repository<UsuarioProyecto>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(BeneficiarioProyecto) private readonly benefProyectoRepo: Repository<BeneficiarioProyecto>,
    @InjectRepository(Beneficiario) private readonly beneficiarioRepo: Repository<Beneficiario>,
    @InjectRepository(Actividad) private readonly actividadRepo: Repository<Actividad>,
    @InjectRepository(Asistencia) private readonly asistenciaRepo: Repository<Asistencia>,
  ) {}

  async listar(estadoId?: number) {
    const qb = this.proyectoRepo
      .createQueryBuilder('p')
      .leftJoin('cat_estados', 'e', 'e.estado_id = p.estado_id')
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.nombre', 'estadoNombre')
      .orderBy('p.nombre_proyecto', 'ASC');

    if (typeof estadoId === 'number') {
      qb.where('p.estado_id = :estadoId', { estadoId });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      proyectoId: r.proyectoId,
      nombreProyecto: r.nombreProyecto,
      descripcion: r.descripcion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: { estadoId: r.estadoId, nombre: r.estadoNombre },
    }));
  }

  async crear(dto: CreateProyectoDto) {
    if (!dto.nombreProyecto || !dto.nombreProyecto.trim()) {
      throw new BadRequestException('nombre_proyecto es requerido');
    }
    if (!dto.fechaInicio) {
      throw new BadRequestException('fecha_inicio es requerido');
    }
    // estado_id es requerido por la BD
    if (dto.estadoId === undefined || dto.estadoId === null) {
      throw new BadRequestException('estado_id es requerido');
    }

    // Validación simple de fechas (opcional, no bloqueante si formato inválido)
    if (dto.fechaFin && dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException('fecha_fin no puede ser anterior a fecha_inicio');
    }

    const entity = this.proyectoRepo.create({
      nombreProyecto: dto.nombreProyecto.trim(),
      descripcion: dto.descripcion ?? null,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin ?? null,
      estadoId: dto.estadoId,
    });

    const saved = await this.proyectoRepo.save(entity);
    return {
      proyectoId: saved.proyectoId,
      nombreProyecto: saved.nombreProyecto,
      descripcion: saved.descripcion ?? null,
      fechaInicio: saved.fechaInicio,
      fechaFin: saved.fechaFin ?? null,
      estadoId: saved.estadoId,
    };
  }

  async buscarPorProyectoId(proyectoId: number) {
    const qb = this.proyectoRepo
      .createQueryBuilder('p')
      .leftJoin('cat_estados', 'e', 'e.estado_id = p.estado_id')
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.nombre', 'estadoNombre')
      .where('p.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('p.proyecto_id', 'DESC');

    const r = await qb.getRawOne();
    if (!r) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    return {
      proyectoId: r.proyectoId,
      nombreProyecto: r.nombreProyecto,
      descripcion: r.descripcion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: { estadoId: r.estadoId, nombre: r.estadoNombre },
    };
  }

  async agregarUsuarioAProyecto(proyectoId: number, usuarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    // Verificar existencia de proyecto y usuario
    const [proyecto, usuario] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.usuarioRepo.findOne({ where: { usuarioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    // Verificar si ya existe la relación
    const existente = await this.usuarioProyectoRepo
      .createQueryBuilder('up')
      .where('up.usuario_id = :usuarioId AND up.proyecto_id = :proyectoId', { usuarioId, proyectoId })
      .getOne();
    if (existente) {
      throw new BadRequestException('El usuario ya está asignado al proyecto');
    }

    const rel = this.usuarioProyectoRepo.create({ proyecto, usuario });
    await this.usuarioProyectoRepo.save(rel);
    return { proyectoId, usuarioId };
  }

  async listarUsuariosDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    // Verificar existencia de proyecto (opcional, pero útil para 404 coherente)
    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('usuarios_x_proyecto', 'up', 'up.usuario_id = u.usuario_id')
      .leftJoin('persona', 'p', 'p.persona_id = u.persona_id')
      .select('u.usuario_id', 'usuarioId')
      .addSelect('u.nombre_usuario', 'nombreUsuario')
      .addSelect('u.correo_electronico', 'correoElectronico')
      .addSelect('u.estado_id', 'estadoId')
      .addSelect('p.persona_id', 'personaId')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
      .where('up.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('u.nombre_usuario', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      usuarioId: r.usuarioId,
      nombreUsuario: r.nombreUsuario,
      correoElectronico: r.correoElectronico,
      estadoId: r.estadoId,
      persona: r.personaId
        ? { personaId: r.personaId, primerNombre: r.primerNombre, primerApellido: r.primerApellido }
        : null,
    }));
  }

  async eliminarUsuarioDeProyecto(proyectoId: number, usuarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const result = await this.usuarioProyectoRepo.delete({ proyectoId, usuarioId });
    if (!result.affected) {
      throw new NotFoundException('El usuario no está asignado al proyecto');
    }
    return { proyectoId, usuarioId, eliminado: true };
  }

  // Beneficiarios
  async agregarBeneficiarioAProyecto(params: {
    proyectoId: number;
    beneficiarioId: number;
    fechaIncorporacion: string; // YYYY-MM-DD
    estadoId: number;
  }) {
    const { proyectoId, beneficiarioId, fechaIncorporacion, estadoId } = params;
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      throw new BadRequestException('beneficiarioId inválido');
    }
    if (typeof fechaIncorporacion !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaIncorporacion)) {
      throw new BadRequestException('fechaIncorporacion debe tener formato YYYY-MM-DD');
    }
    if (!Number.isInteger(estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    const [proyecto, beneficiario] = await Promise.all([
      this.proyectoRepo.findOne({ where: { proyectoId } }),
      this.beneficiarioRepo.findOne({ where: { beneficiarioId } }),
    ]);
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!beneficiario) {
      throw new NotFoundException('No se encontró el beneficiario indicado');
    }

    const existente = await this.benefProyectoRepo.findOne({ where: { proyectoId, beneficiarioId } });
    if (existente) {
      throw new BadRequestException('El beneficiario ya está asignado al proyecto');
    }

    const rel = this.benefProyectoRepo.create({ proyecto, beneficiario, fechaIncorporacion, estadoId });
    await this.benefProyectoRepo.save(rel);
    return { proyectoId, beneficiarioId, fechaIncorporacion, estadoId };
  }

  async listarBeneficiariosDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }

    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.beneficiarioRepo
      .createQueryBuilder('b')
      .innerJoin('beneficiario_proyecto', 'bp', 'bp.beneficiario_id = b.beneficiario_id')
      .leftJoin('persona', 'p', 'p.persona_id = b.persona_id')
      .select('b.beneficiario_id', 'beneficiarioId')
      .addSelect('b.estado_id', 'beneficiarioEstadoId')
      .addSelect('p.persona_id', 'personaId')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
      .addSelect('bp.fecha_incorporacion', 'fechaIncorporacion')
      .addSelect('bp.estado_id', 'estadoId')
      .where('bp.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('p.primer_nombre', 'ASC')
      .addOrderBy('p.primer_apellido', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      beneficiarioId: r.beneficiarioId,
      beneficiarioEstadoId: r.beneficiarioEstadoId,
      persona: r.personaId
        ? { personaId: r.personaId, primerNombre: r.primerNombre, primerApellido: r.primerApellido }
        : null,
      fechaIncorporacion: r.fechaIncorporacion,
      estadoId: r.estadoId,
    }));
  }

  async eliminarBeneficiarioDeProyecto(proyectoId: number, beneficiarioId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      throw new BadRequestException('beneficiarioId inválido');
    }

    const result = await this.benefProyectoRepo.delete({ proyectoId, beneficiarioId });
    if (!result.affected) {
      throw new NotFoundException('El beneficiario no está asignado al proyecto');
    }
    return { proyectoId, beneficiarioId, eliminado: true };
  }

  // Actividades
  async crearActividad(proyectoId: number, dto: CreateActividadDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    const proyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!proyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }
    if (!dto.nombreActividad?.trim()) {
      throw new BadRequestException('nombreActividad es requerido');
    }
    if (!dto.tipoActividad?.trim()) {
      throw new BadRequestException('tipoActividad es requerido');
    }
    if (!dto.fechaActividad || !/^\d{4}-\d{2}-\d{2}$/.test(dto.fechaActividad)) {
      throw new BadRequestException('fechaActividad debe tener formato YYYY-MM-DD');
    }
    const entity = this.actividadRepo.create({
      proyecto,
      nombreActividad: dto.nombreActividad.trim(),
      tipoActividad: dto.tipoActividad.trim(),
      descripcion: dto.descripcion ?? null,
      fechaActividad: dto.fechaActividad,
      lugar: dto.lugar?.trim() ?? null,
    });
    const saved = await this.actividadRepo.save(entity);
    return {
      actividadId: saved.actividadId,
      proyectoId: proyecto.proyectoId,
      nombreActividad: saved.nombreActividad,
      tipoActividad: saved.tipoActividad,
      descripcion: saved.descripcion ?? null,
      fechaActividad: saved.fechaActividad,
      lugar: saved.lugar,
    };
  }

  async listarActividadesDeProyecto(proyectoId: number) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    const existeProyecto = await this.proyectoRepo.findOne({ where: { proyectoId } });
    if (!existeProyecto) {
      throw new NotFoundException('No se encontró el proyecto indicado');
    }

    const rows = await this.actividadRepo
      .createQueryBuilder('a')
      .select('a.actividad_id', 'actividadId')
      .addSelect('a.proyecto_id', 'proyectoId')
      .addSelect('a.nombre_actividad', 'nombreActividad')
      .addSelect('a.tipo_actividad', 'tipoActividad')
      .addSelect('a.descripcion', 'descripcion')
      .addSelect('a.fecha_actividad', 'fechaActividad')
      .addSelect('a.lugar', 'lugar')
      .where('a.proyecto_id = :proyectoId', { proyectoId })
      .orderBy('a.fecha_actividad', 'DESC')
      .addOrderBy('a.actividad_id', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      actividadId: r.actividadId,
      proyectoId: r.proyectoId,
      nombreActividad: r.nombreActividad,
      tipoActividad: r.tipoActividad,
      descripcion: r.descripcion,
      fechaActividad: r.fechaActividad,
      lugar: r.lugar,
    }));
  }

  // Asistencias
  async crearAsistencia(proyectoId: number, actividadId: number, dto: CreateAsistenciaDto) {
    if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
      throw new BadRequestException('proyectoId inválido');
    }
    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new BadRequestException('actividadId inválido');
    }

    // Validar que la actividad exista y pertenezca al proyecto
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

    if (!dto.fechaRegistro || !/^\d{4}-\d{2}-\d{2}$/.test(dto.fechaRegistro)) {
      throw new BadRequestException('fechaRegistro debe tener formato YYYY-MM-DD');
    }
    if (!Number.isInteger(dto.estadoId)) {
      throw new BadRequestException('estadoId inválido');
    }

    const entity = this.asistenciaRepo.create({
      actividad,
      beneficiario,
      fechaRegistro: dto.fechaRegistro,
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

    // Asegurar que la actividad pertenece al proyecto
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
      .select('as.asistencia_id', 'asistenciaId')
      .addSelect('as.actividad_id', 'actividadId')
      .addSelect('as.beneficiario_id', 'beneficiarioId')
      .addSelect('as.fecha_registro', 'fechaRegistro')
      .addSelect('as.estado_id', 'estadoId')
      .addSelect('as.observaciones', 'observaciones')
      .addSelect('p.primer_nombre', 'primerNombre')
      .addSelect('p.primer_apellido', 'primerApellido')
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
          primerNombre: r.primerNombre,
          primerApellido: r.primerApellido,
        },
      },
    }));
  }
}
