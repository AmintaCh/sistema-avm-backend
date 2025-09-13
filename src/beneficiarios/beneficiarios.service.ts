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
