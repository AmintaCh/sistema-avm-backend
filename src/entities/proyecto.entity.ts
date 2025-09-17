import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'proyecto' })
export class Proyecto {
  @PrimaryGeneratedColumn({ name: 'proyecto_id', type: 'int' })
  proyectoId!: number;

  @Column({ name: 'nombre_proyecto', type: 'varchar', length: 100 })
  nombreProyecto!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string; // YYYY-MM-DD

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin?: string | null; // YYYY-MM-DD

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;
}
