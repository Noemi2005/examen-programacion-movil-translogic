import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';

@Entity('camiones_carga')
export class CamionCarga {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consumoLitros100Km: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioLitro: number;

  @Column({ type: 'int' })
  numeroEjes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costoMantenimientoKm: number;

  @Column()
  vehiculoId: string;

  @OneToOne(() => Vehiculo, (vehiculo) => vehiculo.camionCarga, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;
}
