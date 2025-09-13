import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Persona } from './persona.entity';
import { Rol } from './rol.entity';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'usuario_id', type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => Persona, { nullable: false })
  @JoinColumn({ name: 'persona_id', referencedColumnName: 'personaId' })
  persona!: Persona;

  @Column({ name: 'nombre_usuario', type: 'varchar', length: 25, unique: true })
  nombreUsuario!: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 100, unique: true })
  correoElectronico!: string;

  @Column({ name: 'hash_contrasena', type: 'text' })
  hashContrasena!: string;

  @Column({ name: 'fecha_registro', type: 'date' })
  fechaRegistro!: string; // YYYY-MM-DD

  @Column({ name: 'estado_id', type: 'tinyint' })
  estadoId!: number;

  @ManyToOne(() => Rol, { nullable: false })
  @JoinColumn({ name: 'rol_id', referencedColumnName: 'rolId' })
  rol!: Rol;
}
