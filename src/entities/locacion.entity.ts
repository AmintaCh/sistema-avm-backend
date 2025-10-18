import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Municipio } from './municipio.entity';

@Entity({ name: 'locacion' })
export class Locacion {
  @PrimaryGeneratedColumn({ name: 'locacion_id', type: 'int' })
  locacionId!: number;

  @ManyToOne(() => Municipio, { nullable: false })
  @JoinColumn({ name: 'municipio_id', referencedColumnName: 'municipioId' })
  municipio!: Municipio;

  @Column({ name: 'nombre_locacion', type: 'varchar', length: 50 })
  nombreLocacion!: string;
}

