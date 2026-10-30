import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

@Entity('furgonetas_electricas')
export class FurgonetaElectrica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capacidadBateriaKWh: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consumoKWh100Km: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costoKWh: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  autonomiaKm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  porcentajeBateria: number;

  @Column()
  vehiculoId: string;

  @OneToOne(() => Vehiculo, (vehiculo) => vehiculo.furgonetaElectrica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;
}
