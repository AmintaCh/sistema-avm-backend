import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Beneficio } from './beneficio.entity';
import { Beneficiario } from './beneficiario.entity';
import { Proyecto } from './proyecto.entity';
import { EventoEntrega } from './evento-entrega.entity';
import { Usuario } from './usuario.entity';

@Entity({ name: 'entrega_beneficio' })
export class EntregaBeneficio {
  @PrimaryGeneratedColumn({ name: 'entrega_id', type: 'int' })
  entregaId!: number;

  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;

  @ManyToOne(() => Beneficio, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficio_id', referencedColumnName: 'beneficioId' })
  beneficio!: Beneficio;

  @ManyToOne(() => Beneficiario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficiario_id', referencedColumnName: 'beneficiarioId' })
  beneficiario!: Beneficiario;

  @ManyToOne(() => EventoEntrega, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evento_id', referencedColumnName: 'eventoId' })
  evento?: EventoEntrega | null;

  @Column({ name: 'fecha_entrega', type: 'date' })
  fechaEntrega!: string; // YYYY-MM-DD

  @Column({ name: 'cantidad', type: 'decimal', precision: 10, scale: 2 })
  cantidad!: string; // TypeORM devuelve decimal como string

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'entregado_por', referencedColumnName: 'usuarioId' })
  entregadoPor?: Usuario | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn!: Date;
}
