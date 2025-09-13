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

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento!: string; // YYYY-MM-DD

  @Column({ name: 'genero', type: 'varchar', length: 1 })
  genero!: string; // 'M' | 'F' | etc

  @Column({ name: 'tipo_documento', type: 'varchar', length: 15 })
  tipoDocumento!: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 25, unique: true })
  numeroDocumento!: string;

  @Column({ name: 'direccion_detalle', type: 'text', nullable: true })
  direccionDetalle?: string | null;

  @Column({ name: 'municipio_id', type: 'int' })
  municipioId!: number;

  @Column({ name: 'locacion_id', type: 'int' })
  locacionId!: number;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  telefono?: string | null;
}
