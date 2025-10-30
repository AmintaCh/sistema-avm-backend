import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { Usuario } from '../entities/usuario.entity';
import { Rol } from '../entities/rol.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Proyecto } from '../entities/proyecto.entity';
import { UsuarioProyecto } from '../entities/usuario-proyecto.entity';
import { BeneficiarioProyecto } from '../entities/beneficiario-proyecto.entity';
import { UsuarioSettings } from '../entities/usuario-settings.entity';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UpdateUserRolDto } from './dto/update-user-rol.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

type RegistroUsuarioResultado = {
  usuarioId: number;
  personaId: number;
  nombreUsuario: string;
  correoElectronico: string;
  fechaRegistro: string; // ISO date
  estadoId: number;
  rolId: number;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Proyecto) private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(UsuarioProyecto)
    private readonly usuarioProyectoRepo: Repository<UsuarioProyecto>,
    @InjectRepository(BeneficiarioProyecto)
    private readonly benefProyectoRepo: Repository<BeneficiarioProyecto>,
    @InjectRepository(UsuarioSettings)
    private readonly userSettingsRepo: Repository<UsuarioSettings>,
    private readonly jwt: JwtService,
  ) {}

  private validarSettingsDto(dto: UserSettingsDto) {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Body inválido');
    }
    const { theme, scheme, layout } = dto as UserSettingsDto;
    if (!theme || typeof theme !== 'string') {
      throw new BadRequestException('theme es requerido');
    }
    if (!scheme || typeof scheme !== 'string') {
      throw new BadRequestException('scheme es requerido');
    }
    const allowedSchemes = new Set(['light', 'dark', 'auto']);
    if (!allowedSchemes.has(scheme)) {
      throw new BadRequestException("scheme debe ser 'light', 'dark' o 'auto'");
    }
    if (!layout || typeof layout !== 'string') {
      throw new BadRequestException('layout es requerido');
    }
  }

  async crearSettings(usuarioId: number, dto: UserSettingsDto) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }
    this.validarSettingsDto(dto);

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    const existente = await this.userSettingsRepo
      .createQueryBuilder('s')
      .leftJoin('usuario', 'u', 'u.usuario_id = s.usuario_id')
      .where('s.usuario_id = :usuarioId', { usuarioId })
      .getOne();
    if (existente) {
      throw new BadRequestException('Ya existen settings para este usuario (use PUT para actualizar)');
    }

    const entity = this.userSettingsRepo.create({ usuario, theme: dto.theme, scheme: dto.scheme, layout: dto.layout });
    const saved = await this.userSettingsRepo.save(entity);
    return {
      settingsId: saved.settingsId,
      usuarioId: usuario.usuarioId,
      theme: saved.theme,
      scheme: saved.scheme,
      layout: saved.layout,
    };
  }

  async actualizarSettings(usuarioId: number, dto: UserSettingsDto) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }
    this.validarSettingsDto(dto);

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    let settings = await this.userSettingsRepo
      .createQueryBuilder('s')
      .where('s.usuario_id = :usuarioId', { usuarioId })
      .getOne();

    if (!settings) {
      // upsert: crea si no existe
      settings = this.userSettingsRepo.create({ usuario, theme: dto.theme, scheme: dto.scheme, layout: dto.layout });
    } else {
      settings.theme = dto.theme;
      settings.scheme = dto.scheme;
      settings.layout = dto.layout;
    }
    const saved = await this.userSettingsRepo.save(settings);
    return {
      settingsId: saved.settingsId,
      usuarioId: usuario.usuarioId,
      theme: saved.theme,
      scheme: saved.scheme,
      layout: saved.layout,
    };
  }

  async obtenerSettings(usuarioId: number) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const settings = await this.userSettingsRepo
      .createQueryBuilder('s')
      .where('s.usuario_id = :usuarioId', { usuarioId })
      .getOne();

    if (!settings) {
      // No 404: devolver objeto vacío para que el frontend asigne defaults
      return {
        settingsId: null,
        usuarioId,
        theme: null,
        scheme: null,
        layout: null,
      } as any;
    }

    return {
      settingsId: settings.settingsId,
      usuarioId,
      theme: settings.theme,
      scheme: settings.scheme,
      layout: settings.layout,
    };
  }

  async actualizarRol(usuarioId: number, dto: UpdateUserRolDto) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }
    if (!dto || typeof dto !== 'object' || !dto.rolId || !Number.isInteger(dto.rolId) || dto.rolId <= 0) {
      throw new BadRequestException('rolId inválido');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    const rol = await this.rolRepo.findOne({ where: { rolId: dto.rolId } });
    if (!rol) {
      throw new BadRequestException('El rol no existe');
    }

    usuario.rol = rol;
    await this.usuarioRepo.save(usuario);

    return {
      usuarioId: usuario.usuarioId,
      rol: {
        rolId: rol.rolId,
        nombreRol: rol.nombreRol,
      },
    };
  }

  async listar() {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoin('rol', 'r', 'r.rol_id = u.rol_id')
      .leftJoin('cat_estados', 'e', "e.estado_id = u.estado_id AND e.tipo_estado = 'U'")
      .select('u.usuario_id', 'usuarioId')
      .addSelect('u.nombre_usuario', 'nombreUsuario')
      .addSelect('u.correo_electronico', 'correoElectronico')
      .addSelect('u.fecha_registro', 'fechaRegistro')
      .addSelect('u.estado_id', 'estadoId')
      .addSelect('r.rol_id', 'rolId')
      .addSelect('r.nombre_rol', 'nombreRol')
      .addSelect('e.descripcion', 'nombreEstado')
      .addSelect('e.tipo_estado', 'tipoEstado')
      .orderBy('u.usuario_id', 'DESC');

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      usuarioId: r.usuarioId,
      nombreUsuario: r.nombreUsuario,
      correoElectronico: r.correoElectronico,
      fechaRegistro: r.fechaRegistro,
      estado: {
        estadoId: r.estadoId,
        nombre: r.nombreEstado,
        tipoEstado: r.tipoEstado,
      },
      rol: {
        rolId: r.rolId,
        nombreRol: r.nombreRol,
      },
    }));
  }

  async registrar(dto: CreateUserDto): Promise<RegistroUsuarioResultado> {
    // Validaciones mínimas de presencia para evitar DEFAULT en columnas NOT NULL
    if (!dto.primerNombre || !dto.primerNombre.trim()) {
      throw new BadRequestException('El campo primer_nombre es requerido');
    }
    if (!dto.primerApellido || !dto.primerApellido.trim()) {
      throw new BadRequestException('El campo primer_apellido es requerido');
    }
    // Otros campos de persona son opcionales; el perfil podrá completarse luego.

    // Construcción anticipada de nombreUsuario si no viene en el DTO
    const buildNombreUsuario = (data: {
      primerNombre: string;
      segundoNombre?: string | null;
      tercerNombre?: string | null;
      primerApellido: string;
      segundoApellido?: string | null;
      nombreUsuario?: string;
    }) => {
      if (data.nombreUsuario && data.nombreUsuario.trim()) {
        return data.nombreUsuario.trim();
      }
      const parts = [
        data.primerNombre,
        data.segundoNombre ?? '',
        data.tercerNombre ?? '',
        data.primerApellido,
        data.segundoApellido ?? '',
      ]
        .map((p) => (p ?? '').toString().trim())
        .filter((p) => p.length > 0);
      const full = parts.join(' ');
      return full.slice(0, 25);
    };

    const posibleNombreUsuario = buildNombreUsuario(dto);

    // Validaciones de unicidad previas (documento, correo y usuario).
    const [docExistente, emailExistente] = await Promise.all([
      dto.numeroDocumento
        ? this.personaRepo.findOne({ where: { numeroDocumento: dto.numeroDocumento } })
        : Promise.resolve(null),
      this.usuarioRepo.findOne({ where: { correoElectronico: dto.correoElectronico } }),
    ]);

    if (docExistente) {
      throw new BadRequestException('El numero_documento ya existe');
    }
    if (emailExistente) {
      throw new BadRequestException('El correo_electronico ya existe');
    }
    // Ya no se valida unicidad de nombre_usuario en el registro

    const rol = await this.rolRepo.findOne({ where: { rolId: dto.rolId } });
    if (!rol) {
      throw new BadRequestException('El rol no existe');
    }

    const fechaRegistro = new Date().toISOString().slice(0, 10);
    const hashContrasena = this.hashContrasena(dto.contrasena); // formato: salt:hash

    return this.dataSource.transaction(async (manager) => {
      const persona = manager.create(Persona, {
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre ?? null,
        tercerNombre: dto.tercerNombre ?? null,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido ?? null,
        fechaNacimiento: dto.fechaNacimiento ?? null,
        genero: dto.genero ?? null,
        tipoDocumento: dto.tipoDocumento ?? null,
        numeroDocumento: dto.numeroDocumento ?? null,
        direccionDetalle: dto.direccionDetalle ?? null,
        municipioId: dto.municipioId ?? null,
        locacionId: dto.locacionId ?? null,
        telefono: dto.telefono ?? null,
      });
      const personaGuardada = await manager.save(Persona, persona);

      // Si no viene nombreUsuario, generamos uno concatenando nombres y apellidos con espacios (limitado a 25)
      const parts = [
        personaGuardada.primerNombre,
        personaGuardada.segundoNombre ?? '',
        personaGuardada.tercerNombre ?? '',
        personaGuardada.primerApellido,
        personaGuardada.segundoApellido ?? '',
      ]
        .map((p) => (p ?? '').toString().trim())
        .filter((p) => p.length > 0);
      const baseUsername = dto.nombreUsuario && dto.nombreUsuario.trim()
        ? dto.nombreUsuario.trim()
        : parts.join(' ');
      const nombreUsuario = baseUsername.slice(0, 25);

      const usuario = manager.create(Usuario, {
        persona: personaGuardada,
        nombreUsuario,
        correoElectronico: dto.correoElectronico,
        hashContrasena,
        fechaRegistro,
        estadoId: dto.estadoId ?? 1,
        rol,
      });
      const usuarioGuardado = await manager.save(Usuario, usuario);

      return {
        usuarioId: usuarioGuardado.usuarioId,
        personaId: personaGuardada.personaId,
        nombreUsuario: usuarioGuardado.nombreUsuario,
        correoElectronico: usuarioGuardado.correoElectronico,
        fechaRegistro: usuarioGuardado.fechaRegistro,
        estadoId: usuarioGuardado.estadoId,
        rolId: rol.rolId,
      };
    });
  }

  async obtenerPerfil(usuarioId: number) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId }, relations: ['persona'] });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    const p = usuario.persona;
    return {
      usuarioId: usuario.usuarioId,
      personaId: p.personaId,
      nombreUsuario: usuario.nombreUsuario,
      correoElectronico: usuario.correoElectronico,
      fechaRegistro: usuario.fechaRegistro,
      estadoId: usuario.estadoId,
      primerNombre: p.primerNombre,
      segundoNombre: p.segundoNombre ?? null,
      tercerNombre: p.tercerNombre ?? null,
      primerApellido: p.primerApellido,
      segundoApellido: p.segundoApellido ?? null,
      fechaNacimiento: p.fechaNacimiento ?? null,
      genero: p.genero ?? null,
      tipoDocumento: p.tipoDocumento ?? null,
      numeroDocumento: p.numeroDocumento ?? null,
      direccionDetalle: p.direccionDetalle ?? null,
      municipioId: p.municipioId ?? null,
      locacionId: p.locacionId ?? null,
      telefono: p.telefono ?? null,
    };
  }

  async actualizarPerfil(usuarioId: number, dto: UpdateUserProfileDto) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Body inválido');
    }
    // No se permite actualizar correo electrónico
    if ((dto as any).correoElectronico !== undefined) {
      throw new BadRequestException('No se permite actualizar correo_electronico');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId }, relations: ['persona'] });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    // Validaciones de formato/presencia condicionales
    if (dto.primerNombre !== undefined && !dto.primerNombre.toString().trim()) {
      throw new BadRequestException('El campo primer_nombre no puede estar vacío');
    }
    if (dto.primerApellido !== undefined && !dto.primerApellido.toString().trim()) {
      throw new BadRequestException('El campo primer_apellido no puede estar vacío');
    }

    // Validaciones de unicidad condicionales
    // numero_documento
    if (dto.numeroDocumento !== undefined && dto.numeroDocumento !== null && dto.numeroDocumento !== '') {
      const docExistente = await this.personaRepo.findOne({ where: { numeroDocumento: dto.numeroDocumento } });
      if (docExistente && docExistente.personaId !== usuario.persona.personaId) {
        throw new BadRequestException('El numero_documento ya existe');
      }
    }
    // nombre_usuario
    if (dto.nombreUsuario !== undefined && dto.nombreUsuario !== null) {
      const candidato = (dto.nombreUsuario || '').toString().trim();
      if (!candidato) {
        throw new BadRequestException('nombre_usuario no puede estar vacío');
      }
      const username = candidato.slice(0, 25);
      const userExistente = await this.usuarioRepo.findOne({ where: { nombreUsuario: username } });
      if (userExistente && userExistente.usuarioId !== usuario.usuarioId) {
        throw new BadRequestException('El nombre_usuario ya existe');
      }
      dto.nombreUsuario = username; // normalizar para guardar
    }

    // IDs restringidos por este endpoint
    if ((dto as any).estadoId !== undefined) {
      throw new BadRequestException('No se permite actualizar estado_id por este endpoint');
    }

    // Validación básica de municipioId/locacionId si vienen
    if (dto.municipioId !== undefined && dto.municipioId !== null) {
      if (!Number.isInteger(dto.municipioId) || dto.municipioId <= 0) {
        throw new BadRequestException('municipioId inválido');
      }
    }
    if (dto.locacionId !== undefined && dto.locacionId !== null) {
      if (!Number.isInteger(dto.locacionId) || dto.locacionId <= 0) {
        throw new BadRequestException('locacionId inválido');
      }
    }

    // Aplicar cambios en transacción
    return this.dataSource.transaction(async (manager) => {
      // Persona: solo actualizar campos definidos en el DTO
      const p = usuario.persona;
      if (dto.primerNombre !== undefined) p.primerNombre = dto.primerNombre;
      if (dto.segundoNombre !== undefined) p.segundoNombre = dto.segundoNombre;
      if (dto.tercerNombre !== undefined) p.tercerNombre = dto.tercerNombre;
      if (dto.primerApellido !== undefined) p.primerApellido = dto.primerApellido;
      if (dto.segundoApellido !== undefined) p.segundoApellido = dto.segundoApellido;
      if (dto.fechaNacimiento !== undefined) p.fechaNacimiento = dto.fechaNacimiento;
      if (dto.genero !== undefined) p.genero = dto.genero;
      if (dto.tipoDocumento !== undefined) p.tipoDocumento = dto.tipoDocumento;
      if (dto.numeroDocumento !== undefined) p.numeroDocumento = dto.numeroDocumento;
      if (dto.direccionDetalle !== undefined) p.direccionDetalle = dto.direccionDetalle;
      if (dto.municipioId !== undefined) p.municipioId = dto.municipioId as any;
      if (dto.locacionId !== undefined) p.locacionId = dto.locacionId as any;
      if (dto.telefono !== undefined) p.telefono = dto.telefono;
      await manager.save(Persona, p);

      // Usuario: nombreUsuario y contrasena (correo y estado no permitidos aquí)
      if (dto.nombreUsuario !== undefined) {
        usuario.nombreUsuario = dto.nombreUsuario;
      }
      if (dto.contrasena !== undefined) {
        const nueva = (dto.contrasena ?? '').toString().trim();
        if (nueva) {
          usuario.hashContrasena = this.hashContrasena(nueva);
        }
        // si viene vacía o solo espacios, se mantiene la existente
      }
      // estadoId no se actualiza aquí
      const saved = await manager.save(Usuario, usuario);

      return {
        usuarioId: saved.usuarioId,
        personaId: p.personaId,
        nombreUsuario: saved.nombreUsuario,
        correoElectronico: saved.correoElectronico,
        fechaRegistro: saved.fechaRegistro,
        estadoId: saved.estadoId,
      };
    });
  }

  private hashContrasena(plain: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(plain, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  validarContrasena(plain: string, stored: string): boolean {
    try {
      if (!stored || typeof stored !== 'string') return false;
      // Si es un hash bcrypt u otro formato, no lo validamos aquí
      if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
        // bcrypt no soportado sin dependencia; devolver false para credenciales inválidas
        return false;
      }

      const parts = stored.split(':');
      if (parts.length !== 2) return false;
      const [salt, hash] = parts;
      if (!salt || !hash) return false;
      if (hash.length % 2 !== 0) return false; // hex válido
      const bytes = Math.floor(hash.length / 2);
      if (bytes <= 0) return false;
      const derived = scryptSync(plain, salt, bytes).toString('hex');
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(derived, 'hex');
      if (a.length !== b.length) return false; // evita throw en timingSafeEqual
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  async login(dto: LoginDto) {
    if (!dto.contrasena) {
      throw new BadRequestException('La contraseña es requerida');
    }
    if (!dto.usuario && !dto.correoElectronico) {
      throw new BadRequestException('Debe enviar usuario o correo_electronico');
    }

    const whereBy = dto.usuario
      ? { nombreUsuario: dto.usuario }
      : { correoElectronico: dto.correoElectronico! };

    const user = await this.usuarioRepo.findOne({ where: whereBy, relations: ['rol', 'persona'] });
    if (!user) {
      throw new BadRequestException('Credenciales inválidas');
    }
    const ok = this.validarContrasena(dto.contrasena, user.hashContrasena);
    if (!ok) {
      throw new BadRequestException('Credenciales inválidas-');
    }

    // Opcional: validar estado (si tienes un estado específico para inactivo/bloqueado)
    // if (user.estadoId !== 1) { throw new BadRequestException('Usuario no activo'); }

    const expiresInSec = 60 * 60; // 1 hora (coincide con JwtModule)
    const payload = {
      sub: user.usuarioId,
      userId: user.usuarioId, // incluir userId explícito en el token
      username: user.nombreUsuario,
      rolId: user.rol.rolId,
      personaId: user.persona.personaId,
      estadoId: user.estadoId,
    };
    const token = await this.jwt.signAsync(payload);

    // Retornar solo el token para no exponer datos del usuario ni metadatos
    return {
      accessToken: token,
    };
  }

  // JwtService se encarga del firmado/verificación

  async obtenerResumenProyectosUsuario(usuarioId: number) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('usuarioId inválido');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) {
      throw new NotFoundException('No se encontró el usuario indicado');
    }

    // Listado de proyectos asociados al usuario
    const proyectosRaw = await this.proyectoRepo
      .createQueryBuilder('p')
      .innerJoin('usuarios_x_proyecto', 'up', 'up.proyecto_id = p.proyecto_id')
      .leftJoin('cat_estados', 'e', "e.estado_id = p.estado_id AND e.tipo_estado = 'P'")
      .select('p.proyecto_id', 'proyectoId')
      .addSelect('p.nombre_proyecto', 'nombreProyecto')
      .addSelect('p.descripcion', 'descripcion')
      .addSelect('p.fecha_inicio', 'fechaInicio')
      .addSelect('p.fecha_fin', 'fechaFin')
      .addSelect('p.estado_id', 'estadoId')
      .addSelect('e.descripcion', 'estadoNombre')
      .where('up.usuario_id = :usuarioId', { usuarioId })
      .andWhere('p.estado_id = :estadoActivo', { estadoActivo: 1 })
      .orderBy('p.nombre_proyecto', 'ASC')
      .getRawMany();

    const proyectos = proyectosRaw.map((r) => ({
      proyectoId: r.proyectoId,
      nombreProyecto: r.nombreProyecto,
      descripcion: r.descripcion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      estado: { estadoId: r.estadoId, nombre: r.estadoNombre },
    }));

    const totalProyectos = proyectos.length;

    // Total de beneficiarios distintos en los proyectos asociados al usuario
    const totalBenefRaw = await this.benefProyectoRepo
      .createQueryBuilder('bp')
      .innerJoin('usuarios_x_proyecto', 'up', 'up.proyecto_id = bp.proyecto_id')
      .innerJoin('proyecto', 'p', 'p.proyecto_id = bp.proyecto_id')
      .where('up.usuario_id = :usuarioId', { usuarioId })
      .andWhere('p.estado_id = :estadoActivo', { estadoActivo: 1 })
      .select('COUNT(DISTINCT bp.beneficiario_id)', 'total')
      .getRawOne<{ total: string | number }>();

    const totalBeneficiarios = totalBenefRaw ? Number(totalBenefRaw.total) || 0 : 0;

    return {
      usuarioId,
      totalProyectos,
      totalBeneficiarios,
      proyectos,
    };
  }
}
