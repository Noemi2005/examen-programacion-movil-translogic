import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { TipoVehiculo, EstadoVehiculo } from '../../common/enums';
import { CamionCarga } from './camion-carga.entity';
import { FurgonetaElectrica } from './furgoneta-electrica.entity';
import { ServicioTransporte } from './servicio-transporte.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 15 })
  placa: string;

  @Column({ length: 50 })
  marca: string;

  @Column({ length: 50 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capacidadCargaKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  kilometraje: number;

  @Column({
    type: 'varchar',
    length: 30,
  })
  tipo: TipoVehiculo;

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoVehiculo.DISPONIBLE,
  })
  estado: EstadoVehiculo;

  @Column({ type: 'text', nullable: true })
  imagenUrl?: string;

  @OneToOne(() => CamionCarga, (camion) => camion.vehiculo, { cascade: true, eager: true })
  camionCarga?: CamionCarga;

  @OneToOne(() => FurgonetaElectrica, (furgoneta) => furgoneta.vehiculo, { cascade: true, eager: true })
  furgonetaElectrica?: FurgonetaElectrica;

  @OneToMany(() => ServicioTransporte, (servicio) => servicio.vehiculo)
  servicios: ServicioTransporte[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
