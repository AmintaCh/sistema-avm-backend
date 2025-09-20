import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Actividad } from './actividad.entity';
import { Beneficiario } from './beneficiario.entity';

@Entity({ name: 'asistencia' })
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'asistencia_id', type: 'int' })
  asistenciaId!: number;

  @ManyToOne(() => Actividad, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actividad_id', referencedColumnName: 'actividadId' })
  actividad!: Actividad;

  @ManyToOne(() => Beneficiario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficiario_id', referencedColumnName: 'beneficiarioId' })
  beneficiario!: Beneficiario;

  @Column({ name: 'fecha_registro', type: 'date' })
  fechaRegistro!: string; // YYYY-MM-DD

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string | null;
}

