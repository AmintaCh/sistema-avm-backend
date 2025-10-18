import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'persona' })
export class Persona {
  @PrimaryGeneratedColumn({ name: 'persona_id', type: 'int' })
  personaId!: number;

  @Column({ name: 'primer_nombre', type: 'varchar', length: 25 })
  primerNombre!: string;

  @Column({ name: 'segundo_nombre', type: 'varchar', length: 25, nullable: true })
  segundoNombre?: string | null;

  @Column({ name: 'tercer_nombre', type: 'varchar', length: 25, nullable: true })
  tercerNombre?: string | null;

  @Column({ name: 'primer_apellido', type: 'varchar', length: 25 })
  primerApellido!: string;

  @Column({ name: 'segundo_apellido', type: 'varchar', length: 25, nullable: true })
  segundoApellido?: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: string | null; // YYYY-MM-DD

  @Column({ name: 'genero', type: 'varchar', length: 1, nullable: true })
  genero?: string | null; // 'M' | 'F' | etc

  @Column({ name: 'tipo_documento', type: 'varchar', length: 15, nullable: true })
  tipoDocumento?: string | null;

  @Column({ name: 'numero_documento', type: 'varchar', length: 25, unique: true, nullable: true })
  numeroDocumento?: string | null;

  @Column({ name: 'direccion_detalle', type: 'text', nullable: true })
  direccionDetalle?: string | null;

  @Column({ name: 'municipio_id', type: 'int', nullable: true })
  municipioId?: number | null;

  @Column({ name: 'locacion_id', type: 'int', nullable: true })
  locacionId?: number | null;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string | null;
}
