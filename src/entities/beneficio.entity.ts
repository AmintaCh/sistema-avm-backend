import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'beneficio' })
export class Beneficio {
  @PrimaryGeneratedColumn({ name: 'beneficio_id', type: 'int' })
  beneficioId!: number;

  @Column({ name: 'nombre_beneficio', type: 'varchar', length: 100 })
  nombreBeneficio!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 50 })
  unidadMedida!: string;
}

