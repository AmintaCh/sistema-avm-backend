import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'departamento' })
export class Departamento {
  @PrimaryGeneratedColumn({ name: 'departamento_id', type: 'int' })
  departamentoId!: number;

  @Column({ name: 'pais_id', type: 'int' })
  paisId!: number;

  @Column({ name: 'nombre_departamento', type: 'varchar', length: 25 })
  nombreDepartamento!: string;
}

