import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Departamento } from './departamento.entity';

@Entity({ name: 'municipio' })
export class Municipio {
  @PrimaryGeneratedColumn({ name: 'municipio_id', type: 'int' })
  municipioId!: number;

  @ManyToOne(() => Departamento, { nullable: false })
  @JoinColumn({ name: 'departamento_id', referencedColumnName: 'departamentoId' })
  departamento!: Departamento;

  @Column({ name: 'nombre_municipio', type: 'varchar', length: 50 })
  nombreMunicipio!: string;
}

