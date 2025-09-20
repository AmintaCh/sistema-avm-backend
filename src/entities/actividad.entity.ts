import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity({ name: 'actividad' })
export class Actividad {
  @PrimaryGeneratedColumn({ name: 'actividad_id', type: 'int' })
  actividadId!: number;

  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;

  @Column({ name: 'nombre_actividad', type: 'varchar', length: 100 })
  nombreActividad!: string;

  @Column({ name: 'tipo_actividad', type: 'varchar', length: 50 })
  tipoActividad!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'fecha_actividad', type: 'date' })
  fechaActividad!: string; // YYYY-MM-DD

  @Column({ name: 'lugar', type: 'varchar', length: 100, nullable: true })
  lugar?: string | null;
}
