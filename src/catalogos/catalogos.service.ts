import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity';
import { Municipio } from '../entities/municipio.entity';
import { Departamento } from '../entities/departamento.entity';
import { Estado } from '../entities/estado.entity';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Municipio) private readonly municipioRepo: Repository<Municipio>,
    @InjectRepository(Departamento) private readonly departamentoRepo: Repository<Departamento>,
    @InjectRepository(Estado) private readonly estadoRepo: Repository<Estado>,
  ) {}

  async roles() {
    const rows = await this.rolRepo
      .createQueryBuilder('r')
      .select('r.rol_id', 'rolId')
      .addSelect('r.nombre_rol', 'nombreRol')
      .addSelect('r.descripcion', 'descripcion')
      .orderBy('r.nombre_rol', 'ASC')
      .getRawMany();
    return rows.map((r) => ({ rolId: r.rolId, nombreRol: r.nombreRol, descripcion: r.descripcion }));
  }

  async departamentos() {
    const rows = await this.departamentoRepo
      .createQueryBuilder('d')
      .select('d.departamento_id', 'departamentoId')
      .addSelect('d.pais_id', 'paisId')
      .addSelect('d.nombre_departamento', 'nombreDepartamento')
      .orderBy('d.nombre_departamento', 'ASC')
      .getRawMany();
    return rows.map((d) => ({
      departamentoId: d.departamentoId,
      paisId: d.paisId,
      nombreDepartamento: d.nombreDepartamento,
    }));
  }

  async municipios(departamentoId?: number) {
    const qb = this.municipioRepo
      .createQueryBuilder('m')
      .leftJoin('departamento', 'd', 'd.departamento_id = m.departamento_id')
      .select('m.municipio_id', 'municipioId')
      .addSelect('m.nombre_municipio', 'nombreMunicipio')
      .addSelect('d.departamento_id', 'departamentoId')
      .addSelect('d.nombre_departamento', 'nombreDepartamento')
      .orderBy('m.nombre_municipio', 'ASC');

    if (typeof departamentoId === 'number') {
      qb.where('m.departamento_id = :departamentoId', { departamentoId });
    }

    const rows = await qb.getRawMany();
    return rows.map((m) => ({
      municipioId: m.municipioId,
      nombreMunicipio: m.nombreMunicipio,
      departamento: { departamentoId: m.departamentoId, nombreDepartamento: m.nombreDepartamento },
    }));
  }

  async estados(tipoEstado?: string) {
    const qb = this.estadoRepo
      .createQueryBuilder('e')
      .select('e.estado_id', 'estadoId')
      .addSelect('e.descripcion', 'descripcion')
      .addSelect('e.tipo_estado', 'tipoEstado')
      .orderBy('e.descripcion', 'ASC');

    if (typeof tipoEstado === 'string' && tipoEstado.trim()) {
      qb.where('e.tipo_estado = :tipoEstado', { tipoEstado: tipoEstado.trim().toUpperCase().slice(0, 1) });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({ estadoId: r.estadoId, descripcion: r.descripcion, tipoEstado: r.tipoEstado }));
  }
}
