import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ServicioTransporte } from './servicio-transporte.entity';
import { Usuario } from './usuario.entity';

@Entity('historial_estados')
export class HistorialEstado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  servicioId: string;

  @ManyToOne(() => ServicioTransporte, (servicio) => servicio.historialEstados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicioId' })
  servicio: ServicioTransporte;

  @Column({ length: 30 })
  estadoAnterior: string;

  @Column({ length: 30 })
  estadoNuevo: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ nullable: true })
  usuarioId: string;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
}
