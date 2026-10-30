import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Factura } from './factura.entity';
import { ServicioTransporte } from './servicio-transporte.entity';

@Entity('detalles_factura')
export class DetalleFactura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  facturaId: string;

  @ManyToOne(() => Factura, (factura) => factura.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facturaId' })
  factura: Factura;

  @Column({ unique: true })
  servicioId: string;

  @OneToOne(() => ServicioTransporte, (servicio) => servicio.detalleFactura, { eager: true })
  @JoinColumn({ name: 'servicioId' })
  servicio: ServicioTransporte;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tarifa: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  recargos: number;
}
