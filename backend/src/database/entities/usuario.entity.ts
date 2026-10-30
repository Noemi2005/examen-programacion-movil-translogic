import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RolUsuario } from '../../common/enums';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: RolUsuario.OPERADOR,
  })
  rol: RolUsuario;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
