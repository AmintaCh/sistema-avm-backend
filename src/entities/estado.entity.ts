import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cat_estados' })
export class Estado {
  @PrimaryGeneratedColumn({ name: 'estado_id', type: 'int' })
  estadoId!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ name: 'tipo_estado', type: 'char', length: 1 })
  tipoEstado!: string; // 'P' proyectos, 'U' usuarios, etc.
}

