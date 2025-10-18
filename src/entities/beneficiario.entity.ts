import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Persona } from './persona.entity';

@Entity({ name: 'beneficiario' })
export class Beneficiario {
  @PrimaryGeneratedColumn({ name: 'beneficiario_id', type: 'int' })
  beneficiarioId!: number;

  @ManyToOne(() => Persona, { nullable: false })
  @JoinColumn({ name: 'persona_id', referencedColumnName: 'personaId' })
  persona!: Persona;

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: string; // YYYY-MM-DD

  @Column({ name: 'latitud', type: 'varchar', length: 20 })
  latitud!: string;

  @Column({ name: 'longitud', type: 'varchar', length: 20 })
  longitud!: string;
}

