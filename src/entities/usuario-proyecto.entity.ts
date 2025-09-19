import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Proyecto } from './proyecto.entity';

@Entity({ name: 'usuarios_x_proyecto' })
export class UsuarioProyecto {
  @PrimaryColumn({ name: 'usuario_id', type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'usuarioId' })
  usuario!: Usuario;

  @PrimaryColumn({ name: 'proyecto_id', type: 'int' })
  proyectoId!: number;

  @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id', referencedColumnName: 'proyectoId' })
  proyecto!: Proyecto;
}
