import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EstadoServicio } from '../../common/enums';
import { Cliente } from './cliente.entity';
import { Vehiculo } from './vehiculo.entity';
import { HistorialEstado } from './historial-estado.entity';
import { DetalleFactura } from './detalle-factura.entity';

@Entity('servicios_transporte')
export class ServicioTransporte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  codigo: string;

  @Column()
  clienteId: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.servicios, { eager: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ nullable: true })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.servicios, { nullable: true, eager: true })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ length: 150 })
  origen: string;

  @Column({ length: 150 })
  destino: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distanciaKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pesoCargaKg: number;

  @Column({ type: 'date' })
  fecha: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 10 })
  horaInicio: string; // HH:mm

  @Column({ type: 'varchar', length: 10 })
  horaFinEstimada: string; // HH:mm

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoServicio.PROGRAMADO,
  })
  estado: EstadoServicio;

  @Column({ default: false })
  recargaPlanificada: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tarifaCalculada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoOperativo: number;

  @Column({ default: false })
  facturado: boolean;

  @OneToMany(() => HistorialEstado, (historial) => historial.servicio)
  historialEstados: HistorialEstado[];

  @OneToOne(() => DetalleFactura, (detalle) => detalle.servicio)
  detalleFactura: DetalleFactura;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
