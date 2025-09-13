import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'rol' })
export class Rol {
  @PrimaryGeneratedColumn({ name: 'rol_id', type: 'int' })
  rolId!: number;

  @Column({ name: 'nombre_rol', type: 'varchar', length: 50, unique: true })
  nombreRol!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string | null;
}
