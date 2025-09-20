import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cat_estados' })
export class Estado {
  @PrimaryGeneratedColumn({ name: 'estado_id', type: 'int' })
  estadoId!: number;

  @Column({ name: 'descripcion', type: 'varchar', length: 20 })
  descripcion!: string;

  @Column({ name: 'tipo_estado', type: 'char', length: 1 })
  tipoEstado!: string; // 'P' proyectos, 'U' usuarios, etc.

  @Column({ name: 'descripcion_tipo', type: 'char', length: 30 })
  descripcionTipo!: string;
}

