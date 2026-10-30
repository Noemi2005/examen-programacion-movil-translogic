import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ServicioTransporte } from './servicio-transporte.entity';
import { Factura } from './factura.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  identificacion: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ unique: true, length: 150 })
  correo: string;

  @Column({ length: 25 })
  telefono: string;

  @OneToMany(() => ServicioTransporte, (servicio) => servicio.cliente)
  servicios: ServicioTransporte[];

  @OneToMany(() => Factura, (factura) => factura.cliente)
  facturas: Factura[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
