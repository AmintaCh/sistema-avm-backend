import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Beneficio } from './beneficio.entity';
import { Proyecto } from './proyecto.entity';

@Entity({ name: 'beneficios_x_proyecto' })
export class BeneficioProyecto {
  @PrimaryColumn({ name: 'beneficio_id', type: 'int' })
  beneficioId!: number;

  @ManyToOne(() => Beneficio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficio_id', referencedColumnName: 'beneficioId' })
  beneficio!: Beneficio;

  @PrimaryColumn({ name: 'proyecto_id', type: 'int' })
  proyectoId!: number;

  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;
}

