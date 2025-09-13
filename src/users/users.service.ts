import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { Usuario } from '../entities/usuario.entity';
import { Rol } from '../entities/rol.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

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
    private readonly jwt: JwtService,
  ) {}

  async listar() {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoin('rol', 'r', 'r.rol_id = u.rol_id')
      .leftJoin('cat_estados', 'e', 'e.estado_id = u.estado_id')
      .select('u.usuario_id', 'usuarioId')
      .addSelect('u.nombre_usuario', 'nombreUsuario')
      .addSelect('u.correo_electronico', 'correoElectronico')
      .addSelect('u.fecha_registro', 'fechaRegistro')
      .addSelect('u.estado_id', 'estadoId')
      .addSelect('r.rol_id', 'rolId')
      .addSelect('r.nombre_rol', 'nombreRol')
      .addSelect('e.nombre', 'nombreEstado')
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
    if (!dto.tipoDocumento || !dto.numeroDocumento) {
      throw new BadRequestException('tipo_documento y numero_documento son requeridos');
    }
    if (!dto.municipioId) {
      throw new BadRequestException('municipio_id y locacion_id son requeridos');
    }

    // Validaciones de unicidad previas (documento, correo y usuario).
    const [docExistente, emailExistente, userExistente] = await Promise.all([
      this.personaRepo.findOne({ where: { numeroDocumento: dto.numeroDocumento } }),
      this.usuarioRepo.findOne({ where: { correoElectronico: dto.correoElectronico } }),
      dto.nombreUsuario
        ? this.usuarioRepo.findOne({ where: { nombreUsuario: dto.nombreUsuario } })
        : Promise.resolve(null),
    ]);

    if (docExistente) {
      throw new BadRequestException('El numero_documento ya existe');
    }
    if (emailExistente) {
      throw new BadRequestException('El correo_electronico ya existe');
    }
    if (userExistente) {
      throw new BadRequestException('El nombre_usuario ya existe');
    }

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
        fechaNacimiento: dto.fechaNacimiento,
        genero: dto.genero,
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        direccionDetalle: dto.direccionDetalle ?? null,
        municipioId: dto.municipioId,
        locacionId: dto.locacionId,
        telefono: dto.telefono ?? null,
      });
      const personaGuardada = await manager.save(Persona, persona);

      // Si no viene nombreUsuario, generamos uno basado en nombre + apellido (limitado a 25)
      const baseUsername = dto.nombreUsuario
        ? dto.nombreUsuario
        : `${personaGuardada.primerNombre}.${personaGuardada.primerApellido}`.toLowerCase();
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
      username: user.nombreUsuario,
      rolId: user.rol.rolId,
      personaId: user.persona.personaId,
      estadoId: user.estadoId,
    };
    const token = await this.jwt.signAsync(payload);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: expiresInSec,
      usuario: {
        usuarioId: user.usuarioId,
        nombreUsuario: user.nombreUsuario,
        correoElectronico: user.correoElectronico,
        rol: { rolId: user.rol.rolId, nombreRol: user.rol.nombreRol },
        estadoId: user.estadoId,
      },
    };
  }

  // JwtService se encarga del firmado/verificación
}
