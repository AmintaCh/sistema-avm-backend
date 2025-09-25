import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ name: 'usuario_settings' })
@Unique(['usuario'])
export class UsuarioSettings {
  @PrimaryGeneratedColumn({ name: 'settings_id', type: 'int' })
  settingsId!: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'usuarioId' })
  usuario!: Usuario;

  @Column({ name: 'theme', type: 'varchar', length: 50 })
  theme!: string;

  @Column({ name: 'scheme', type: 'varchar', length: 50 })
  scheme!: string; // expected: 'light' | 'dark' | 'auto'

  @Column({ name: 'layout', type: 'varchar', length: 50 })
  layout!: string; // e.g., 'classic', 'classy', 'empty'
}

