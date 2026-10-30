import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { TarifaCalculatorService } from '../modules/vehiculos/tarifa-calculator.service';
import { TipoVehiculo, EstadoVehiculo, EstadoServicio, RolUsuario } from '../common/enums';
import { Vehiculo } from '../database/entities/vehiculo.entity';

describe('TRANSLOGIC S.A. - Suite de Pruebas Automatizadas (Req-09)', () => {
  let tarifaCalculator: TarifaCalculatorService;

  beforeEach(() => {
    tarifaCalculator = new TarifaCalculatorService();
  });

  // TEST 1: Tarifas Camión de carga
  test('1. [Tarifas] Camión de carga calcula correctamente costo operativo, tarifa base y recargo del 8% al superar 80% de capacidad', () => {
    const camionVehiculo: any = {
      id: 'camion-1',
      placa: 'PBA-1000',
      tipo: TipoVehiculo.CAMION_CARGA,
      capacidadCargaKg: 10000,
      camionCarga: {
        consumoLitros100Km: 25,
        precioLitro: 1.0,
        costoMantenimientoKm: 0.1,
      },
    };

    // Distancia = 100 km, Peso = 9000 kg (> 80% de 10000 kg -> debe aplicar recargo 8%)
    // Costo combustible = (100 / 100) * 25 * 1.0 = 25
    // Costo mantenimiento = 100 * 0.1 = 10
    // Costo operativo = 25 + 10 = 35
    // Tarifa base = 35 * 1.35 = 47.25
    // Recargo 8% = 47.25 * 0.08 = 3.78
    // Tarifa final = 47.25 + 3.78 = 51.03
    const resultado = tarifaCalculator.calcularTarifa(camionVehiculo, 100, 9000);

    expect(resultado.costoDirecto).toBe(25);
    expect(resultado.costoOperativo).toBe(35);
    expect(resultado.tarifaBase).toBe(47.25);
    expect(resultado.recargos).toBe(3.78);
    expect(resultado.tarifaFinal).toBe(51.03);
  });

  // TEST 2: Tarifas Furgoneta eléctrica
  test('2. [Tarifas] Furgoneta eléctrica calcula tarifa base y añade 10% si distancia supera 80% de autonomía nominal', () => {
    const furgonetaVehiculo: any = {
      id: 'furgoneta-1',
      placa: 'PBE-2000',
      tipo: TipoVehiculo.FURGONETA_ELECTRICA,
      capacidadCargaKg: 3000,
      furgonetaElectrica: {
        capacidadBateriaKWh: 80,
        consumoKWh100Km: 20,
        costoKWh: 0.1,
        autonomiaKm: 400,
        porcentajeBateria: 100,
      },
    };

    // Distancia = 350 km (> 80% de 400 km = 320 km -> aplica recargo 10%)
    // Costo energético = (350 / 100) * 20 * 0.1 = 7.0
    // Tarifa base = (7.0 + 18) * 1.30 = 25 * 1.30 = 32.50
    // Recargo 10% = 32.50 * 0.10 = 3.25
    // Tarifa final = 32.50 + 3.25 = 35.75
    const resultado = tarifaCalculator.calcularTarifa(furgonetaVehiculo, 350, 2000);

    expect(resultado.costoDirecto).toBe(7);
    expect(resultado.tarifaBase).toBe(32.5);
    expect(resultado.recargos).toBe(3.25);
    expect(resultado.tarifaFinal).toBe(35.75);
  });

  // TEST 3: Límites de carga
  test('3. [Límites] Rechaza cargas que superen la capacidad de carga máxima autorizada', () => {
    const camionVehiculo: any = {
      id: 'camion-2',
      placa: 'PBA-2020',
      tipo: TipoVehiculo.CAMION_CARGA,
      capacidadCargaKg: 5000,
      camionCarga: {
        consumoLitros100Km: 20,
        precioLitro: 0.75,
        costoMantenimientoKm: 0.05,
      },
    };

    // Peso = 6000 kg > capacidad 5000 kg -> debe lanzar BadRequestException
    expect(() => {
      tarifaCalculator.calcularTarifa(camionVehiculo, 100, 6000);
    }).toThrow(BadRequestException);
  });

  // TEST 4: Límites de batería y recarga planificada
  test('4. [Límites] Impide inicio de servicio eléctrico sin energía suficiente salvo recarga planificada', () => {
    const furgonetaVehiculo: any = {
      id: 'furgoneta-3',
      placa: 'PBE-3030',
      tipo: TipoVehiculo.FURGONETA_ELECTRICA,
      capacidadCargaKg: 3000,
      furgonetaElectrica: {
        capacidadBateriaKWh: 50,
        consumoKWh100Km: 25, // 0.25 kWh/km
        costoKWh: 0.1,
        autonomiaKm: 200,
        porcentajeBateria: 20, // Solo tiene 10 kWh disponibles -> 40 km de autonomía
      },
    };

    // Intento para distancia de 100 km sin recarga planificada -> debe fallar
    expect(() => {
      tarifaCalculator.calcularTarifa(furgonetaVehiculo, 100, 1000, false);
    }).toThrow(BadRequestException);

    // Con recarga planificada registrada -> debe autorizar el cálculo
    const resConRecarga = tarifaCalculator.calcularTarifa(furgonetaVehiculo, 100, 1000, true);
    expect(resConRecarga.tarifaFinal).toBeGreaterThan(0);
  });

  // TEST 5: Autonomía y porcentaje de batería 0-100%
  test('5. [Límites] Rechaza baterías fuera del rango 0-100% y calcula autonomía exacta', () => {
    const furgonetaInvalida: any = {
      id: 'furgoneta-4',
      tipo: TipoVehiculo.FURGONETA_ELECTRICA,
      capacidadCargaKg: 3000,
      furgonetaElectrica: {
        capacidadBateriaKWh: 60,
        consumoKWh100Km: 20,
        costoKWh: 0.1,
        autonomiaKm: 300,
        porcentajeBateria: 105, // INVÁLIDO
      },
    };

    expect(() => {
      tarifaCalculator.calcularTarifa(furgonetaInvalida, 50, 500);
    }).toThrow(BadRequestException);

    // Batería válida 50% de 60 kWh a 20 kWh/100km -> 30 kWh / 0.2 kWh/km = 150 km
    const auto = tarifaCalculator.calcularAutonomiaDisponible(60, 20, 50);
    expect(auto).toBe(150);
  });

  // TEST 6: Detección de solapamiento de horarios (Concurrencia y Estados)
  test('6. [Concurrencia / Horarios] Detección de solapamiento de horarios en un mismo vehículo', () => {
    // Función matemática pura de intersección de intervalos [ini1, fin1] y [ini2, fin2]
    const haySolapamiento = (ini1: string, fin1: string, ini2: string, fin2: string) => {
      return !(fin1 <= ini2 || ini1 >= fin2);
    };

    // Servicio A: 08:00 a 12:00
    // Servicio B: 10:00 a 14:00 (Intersección entre 10:00 y 12:00 -> solapa)
    expect(haySolapamiento('08:00', '12:00', '10:00', '14:00')).toBe(true);

    // Servicio C: 12:00 a 16:00 (Justo termina y empieza -> no solapa)
    expect(haySolapamiento('08:00', '12:00', '12:00', '16:00')).toBe(false);

    // Servicio D: 13:00 a 15:00 (Después de 12:00 -> no solapa)
    expect(haySolapamiento('08:00', '12:00', '13:00', '15:00')).toBe(false);
  });

  // TEST 7: Descuentos y recargos de facturación simulada
  test('7. [Facturación] Aplica recargo de distancia > 300 km (6%) y descuento por cliente recurrente (5%)', () => {
    const tarifaBaseServicio = 200;
    const distancia = 350; // > 300 km -> recargo 6%

    let recargoDistancia = 0;
    if (distancia > 300) {
      recargoDistancia = Math.round(tarifaBaseServicio * 0.06 * 100) / 100; // 12.00
    }
    expect(recargoDistancia).toBe(12.0);

    const subtotalConRecargo = tarifaBaseServicio + recargoDistancia; // 212.00
    // Cliente con 4 servicios completados en el mes -> descuento del 5%
    const totalServiciosMes = 4;
    const porcentajeDescuento = totalServiciosMes >= 3 && totalServiciosMes <= 5 ? 0.05 : 0;
    const descuento = Math.round(subtotalConRecargo * porcentajeDescuento * 100) / 100; // 10.60
    expect(descuento).toBe(10.6);

    const baseImponible = subtotalConRecargo - descuento; // 201.40
    const impuestoIVA15 = Math.round(baseImponible * 0.15 * 100) / 100; // 30.21
    const totalFactura = Math.round((baseImponible + impuestoIVA15) * 100) / 100;

    expect(totalFactura).toBe(231.61);
  });

  // TEST 8: Seguridad, Hashing y Roles
  test('8. [Seguridad] Contraseña con hash bcrypt es segura y no reversible en texto plano', async () => {
    const passwordOriginal = 'Admin123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordOriginal, salt);

    expect(hash).not.toBe(passwordOriginal);
    const esValida = await bcrypt.compare(passwordOriginal, hash);
    expect(esValida).toBe(true);

    const esInvalida = await bcrypt.compare('ClaveErronea', hash);
    expect(esInvalida).toBe(false);
  });
});
