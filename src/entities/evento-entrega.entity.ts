import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';

@Entity({ name: 'evento_entrega' })
export class EventoEntrega {
  @PrimaryGeneratedColumn({ name: 'evento_id', type: 'int' })
  eventoId!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ name: 'fecha_evento', type: 'date' })
  fechaEvento!: string; // YYYY-MM-DD

  @ManyToOne(() => Proyecto, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;

  @Column({ name: 'lugar', type: 'varchar', length: 150, nullable: true })
  lugar?: string | null;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string | null;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'usuarioId' })
  creadoPor!: Usuario;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn!: Date;
}

