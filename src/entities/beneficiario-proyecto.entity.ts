import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Beneficiario } from './beneficiario.entity';
import { Proyecto } from './proyecto.entity';

@Entity({ name: 'beneficiario_proyecto' })
export class BeneficiarioProyecto {
  @PrimaryColumn({ name: 'beneficiario_id', type: 'int' })
  beneficiarioId!: number;

  @ManyToOne(() => Beneficiario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficiario_id', referencedColumnName: 'beneficiarioId' })
  beneficiario!: Beneficiario;

  @PrimaryColumn({ name: 'proyecto_id', type: 'int' })
  proyectoId!: number;

  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;

  @Column({ name: 'fecha_incorporacion', type: 'date' })
  fechaIncorporacion!: string; // YYYY-MM-DD

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;
}

