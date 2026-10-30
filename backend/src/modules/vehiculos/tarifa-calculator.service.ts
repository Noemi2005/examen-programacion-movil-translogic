import { Injectable, BadRequestException } from '@nestjs/common';
import { TipoVehiculo } from '../../common/enums';
import { Vehiculo } from '../../database/entities/vehiculo.entity';

export interface CalculoTarifaResultado {
  costoDirecto: number; // Combustible o Energía
  costoOperativo: number;
  tarifaBase: number;
  recargos: number;
  tarifaFinal: number;
  autonomiaDisponibleKm?: number;
  recargoAplicadoDescripcion?: string;
}

@Injectable()
export class TarifaCalculatorService {
  /**
   * Redondeo a 2 decimales para aritmética monetaria exacta
   */
  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calcula la autonomía disponible de una furgoneta eléctrica:
   * (capacidadBateriaKWh * (porcentajeBateria / 100)) / (consumoKWh100Km / 100)
   */
  public calcularAutonomiaDisponible(
    capacidadBateriaKWh: number,
    consumoKWh100Km: number,
    porcentajeBateria: number,
  ): number {
    if (consumoKWh100Km <= 0) {
      throw new BadRequestException('El consumo eléctrico debe ser mayor a 0');
    }
    const energiaDisponibleKWh = capacidadBateriaKWh * (porcentajeBateria / 100);
    const autonomia = energiaDisponibleKWh / (consumoKWh100Km / 100);
    return this.round(autonomia);
  }

  /**
   * Cálculo polimórfico de tarifas y costos según Req-02
   */
  public calcularTarifa(
    vehiculo: Vehiculo,
    distanciaKm: number,
    pesoCargaKg: number,
    recargaPlanificada: boolean = false,
  ): CalculoTarifaResultado {
    if (distanciaKm <= 0) {
      throw new BadRequestException('La distancia debe ser un valor positivo mayor a 0');
    }
    if (pesoCargaKg <= 0) {
      throw new BadRequestException('El peso de la carga debe ser un valor positivo mayor a 0');
    }
    if (pesoCargaKg > Number(vehiculo.capacidadCargaKg)) {
      throw new BadRequestException(
        `La carga (${pesoCargaKg} kg) excede la capacidad autorizada del vehículo (${vehiculo.capacidadCargaKg} kg)`,
      );
    }

    if (vehiculo.tipo === TipoVehiculo.CAMION_CARGA) {
      const camion = vehiculo.camionCarga;
      if (!camion) {
        throw new BadRequestException('Datos técnicos del camión de carga incompletos');
      }

      // Costo combustible = (distancia / 100) * consumoLitros100Km * precioLitro
      const costoCombustible = (distanciaKm / 100) * Number(camion.consumoLitros100Km) * Number(camion.precioLitro);
      // Costo operativo = costo combustible + (distancia * costoMantenimientoKm)
      const costoOperativo = costoCombustible + distanciaKm * Number(camion.costoMantenimientoKm);
      // Tarifa base = costo operativo * 1.35
      let tarifaBase = costoOperativo * 1.35;
      let recargos = 0;
      let recargoDescripcion = 'Sin recargo adicional';

      // Si la carga supera el 80% de la capacidad, añadir 8% a la tarifa base
      const umbralCarga = Number(vehiculo.capacidadCargaKg) * 0.8;
      if (pesoCargaKg > umbralCarga) {
        recargos = tarifaBase * 0.08;
        recargoDescripcion = 'Recargo del 8% por peso superior al 80% de la capacidad';
      }

      const tarifaFinal = tarifaBase + recargos;

      return {
        costoDirecto: this.round(costoCombustible),
        costoOperativo: this.round(costoOperativo),
        tarifaBase: this.round(tarifaBase),
        recargos: this.round(recargos),
        tarifaFinal: this.round(tarifaFinal),
        recargoAplicadoDescripcion: recargoDescripcion,
      };
    } else if (vehiculo.tipo === TipoVehiculo.FURGONETA_ELECTRICA) {
      const furgoneta = vehiculo.furgonetaElectrica;
      if (!furgoneta) {
        throw new BadRequestException('Datos técnicos de la furgoneta eléctrica incompletos');
      }

      if (furgoneta.porcentajeBateria < 0 || furgoneta.porcentajeBateria > 100) {
        throw new BadRequestException('El porcentaje de batería debe estar en el rango de 0% a 100%');
      }

      // Autonomía disponible
      const autonomiaDisponible = this.calcularAutonomiaDisponible(
        Number(furgoneta.capacidadBateriaKWh),
        Number(furgoneta.consumoKWh100Km),
        Number(furgoneta.porcentajeBateria),
      );

      // Impedir inicio si no tiene energía suficiente, salvo recarga planificada
      if (distanciaKm > autonomiaDisponible && !recargaPlanificada) {
        throw new BadRequestException(
          `Energía insuficiente: Autonomía disponible de ${autonomiaDisponible} km para una distancia requerida de ${distanciaKm} km. Registre una recarga planificada para autorizar el servicio.`,
        );
      }

      // Costo energético = (distancia / 100) * consumoKWh100Km * costoKWh
      const costoEnergetico = (distanciaKm / 100) * Number(furgoneta.consumoKWh100Km) * Number(furgoneta.costoKWh);
      // Tarifa base = (costo energético + USD 18) * 1.30
      const tarifaBase = (costoEnergetico + 18) * 1.3;
      let recargos = 0;
      let recargoDescripcion = 'Sin recargo adicional';

      // Si la distancia supera el 80% de la autonomía técnica del vehículo, añadir 10% a la tarifa base
      const umbralAutonomia = Number(furgoneta.autonomiaKm) * 0.8;
      if (distanciaKm > umbralAutonomia) {
        recargos = tarifaBase * 0.1;
        recargoDescripcion = 'Recargo del 10% por distancia mayor al 80% de la autonomía nominal';
      }

      const tarifaFinal = tarifaBase + recargos;

      return {
        costoDirecto: this.round(costoEnergetico),
        costoOperativo: this.round(costoEnergetico), // en eléctricas el costo directo es el energético base
        tarifaBase: this.round(tarifaBase),
        recargos: this.round(recargos),
        tarifaFinal: this.round(tarifaFinal),
        autonomiaDisponibleKm: autonomiaDisponible,
        recargoAplicadoDescripcion: recargoDescripcion,
      };
    } else {
      throw new BadRequestException(`Tipo de vehículo no reconocido: ${vehiculo.tipo}`);
    }
  }
}
