import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de .env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim();
      process.env[key.trim()] = val;
    }
  }
}
import {
  Usuario,
  Cliente,
  Vehiculo,
  CamionCarga,
  FurgonetaElectrica,
  ServicioTransporte,
  HistorialEstado,
  Factura,
  DetalleFactura,
} from './entities';
import { RolUsuario, TipoVehiculo, EstadoVehiculo, EstadoServicio } from '../common/enums';


const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'translogic_db',
  entities: [
    Usuario,
    Cliente,
    Vehiculo,
    CamionCarga,
    FurgonetaElectrica,
    ServicioTransporte,
    HistorialEstado,
    Factura,
    DetalleFactura,
  ],
  synchronize: true,
});

async function runSeed() {
  console.log('--- Iniciando Seeding Reproducible de TRANSLOGIC S.A. ---');
  await AppDataSource.initialize();

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const clienteRepo = AppDataSource.getRepository(Cliente);
  const vehiculoRepo = AppDataSource.getRepository(Vehiculo);
  const camionRepo = AppDataSource.getRepository(CamionCarga);
  const furgonetaRepo = AppDataSource.getRepository(FurgonetaElectrica);
  const servicioRepo = AppDataSource.getRepository(ServicioTransporte);
  const historialRepo = AppDataSource.getRepository(HistorialEstado);

  // 1. Usuarios
  console.log('Poblando usuarios...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const operadorPassword = await bcrypt.hash('Operador123!', salt);

  let admin = await usuarioRepo.findOne({ where: { email: 'admin@translogic.com' } });
  if (!admin) {
    admin = usuarioRepo.create({
      nombre: 'Administrador General',
      email: 'admin@translogic.com',
      passwordHash: adminPassword,
      rol: RolUsuario.ADMINISTRADOR,
      activo: true,
    });
    admin = await usuarioRepo.save(admin);
  }

  let operador = await usuarioRepo.findOne({ where: { email: 'operador@translogic.com' } });
  if (!operador) {
    operador = usuarioRepo.create({
      nombre: 'Operador Logístico',
      email: 'operador@translogic.com',
      passwordHash: operadorPassword,
      rol: RolUsuario.OPERADOR,
      activo: true,
    });
    operador = await usuarioRepo.save(operador);
  }

  // 2. Clientes
  console.log('Poblando clientes...');
  const clientesData = [
    { identificacion: '1790011223001', nombre: 'Corporación Favorita S.A.', correo: 'contacto@favorita.ec', telefono: '0991234567' },
    { identificacion: '1790022334001', nombre: 'Distribuidora Importadora ALFA', correo: 'logistica@alfa.ec', telefono: '0987654321' },
    { identificacion: '1790033445001', nombre: 'Agroexportadora Los Andes', correo: 'despachos@losandes.com', telefono: '0995544332' },
    { identificacion: '1790044556001', nombre: 'Farmacéutica Continental', correo: 'pedidos@continental.ec', telefono: '0981122334' },
  ];

  const clientesGuardados: Cliente[] = [];
  for (const c of clientesData) {
    let cliente = await clienteRepo.findOne({ where: { identificacion: c.identificacion } });
    if (!cliente) {
      cliente = await clienteRepo.save(clienteRepo.create(c));
    }
    clientesGuardados.push(cliente);
  }

  // 3. Vehículos
  console.log('Poblando flota de vehículos...');
  // Camión 1
  let camion1 = await vehiculoRepo.findOne({ where: { placa: 'PBA-1024' } });
  if (!camion1) {
    camion1 = await vehiculoRepo.save(
      vehiculoRepo.create({
        placa: 'PBA-1024',
        marca: 'Hino',
        modelo: 'GH 1826',
        anio: 2022,
        capacidadCargaKg: 12000,
        kilometraje: 45000,
        tipo: TipoVehiculo.CAMION_CARGA,
        estado: EstadoVehiculo.DISPONIBLE,
        imagenUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
      }),
    );
    await camionRepo.save(
      camionRepo.create({
        vehiculoId: camion1.id,
        consumoLitros100Km: 28.5,
        precioLitro: 0.75,
        numeroEjes: 3,
        costoMantenimientoKm: 0.12,
      }),
    );
  } else if (!camion1.imagenUrl) {
    camion1.imagenUrl = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80';
    await vehiculoRepo.save(camion1);
  }

  // Camión 2
  let camion2 = await vehiculoRepo.findOne({ where: { placa: 'PBA-5589' } });
  if (!camion2) {
    camion2 = await vehiculoRepo.save(
      vehiculoRepo.create({
        placa: 'PBA-5589',
        marca: 'Mercedes-Benz',
        modelo: 'Atego 1726',
        anio: 2023,
        capacidadCargaKg: 10000,
        kilometraje: 28000,
        tipo: TipoVehiculo.CAMION_CARGA,
        estado: EstadoVehiculo.DISPONIBLE,
        imagenUrl: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1000&q=80',
      }),
    );
    await camionRepo.save(
      camionRepo.create({
        vehiculoId: camion2.id,
        consumoLitros100Km: 24.0,
        precioLitro: 0.75,
        numeroEjes: 2,
        costoMantenimientoKm: 0.10,
      }),
    );
  } else if (!camion2.imagenUrl) {
    camion2.imagenUrl = 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1000&q=80';
    await vehiculoRepo.save(camion2);
  }

  // Furgoneta Eléctrica 1
  let furgoneta1 = await vehiculoRepo.findOne({ where: { placa: 'PBE-3310' } });
  if (!furgoneta1) {
    furgoneta1 = await vehiculoRepo.save(
      vehiculoRepo.create({
        placa: 'PBE-3310',
        marca: 'BYD',
        modelo: 'T3 Electric',
        anio: 2024,
        capacidadCargaKg: 3500,
        kilometraje: 12000,
        tipo: TipoVehiculo.FURGONETA_ELECTRICA,
        estado: EstadoVehiculo.DISPONIBLE,
        imagenUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
      }),
    );
    await furgonetaRepo.save(
      furgonetaRepo.create({
        vehiculoId: furgoneta1.id,
        capacidadBateriaKWh: 80,
        consumoKWh100Km: 22,
        costoKWh: 0.09,
        autonomiaKm: 320,
        porcentajeBateria: 95,
      }),
    );
  } else if (!furgoneta1.imagenUrl) {
    furgoneta1.imagenUrl = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80';
    await vehiculoRepo.save(furgoneta1);
  }

  // Furgoneta Eléctrica 2
  let furgoneta2 = await vehiculoRepo.findOne({ where: { placa: 'PBE-7744' } });
  if (!furgoneta2) {
    furgoneta2 = await vehiculoRepo.save(
      vehiculoRepo.create({
        placa: 'PBE-7744',
        marca: 'Renault',
        modelo: 'Master E-Tech',
        anio: 2023,
        capacidadCargaKg: 3000,
        kilometraje: 18500,
        tipo: TipoVehiculo.FURGONETA_ELECTRICA,
        estado: EstadoVehiculo.DISPONIBLE,
        imagenUrl: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1000&q=80',
      }),
    );
    await furgonetaRepo.save(
      furgonetaRepo.create({
        vehiculoId: furgoneta2.id,
        capacidadBateriaKWh: 75,
        consumoKWh100Km: 25,
        costoKWh: 0.09,
        autonomiaKm: 280,
        porcentajeBateria: 85,
      }),
    );
  } else if (!furgoneta2.imagenUrl) {
    furgoneta2.imagenUrl = 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1000&q=80';
    await vehiculoRepo.save(furgoneta2);
  }

  // Camión 3 (Sin servicios en octubre para Consulta 24)
  let camion3 = await vehiculoRepo.findOne({ where: { placa: 'PBA-9900' } });
  if (!camion3) {
    camion3 = await vehiculoRepo.save(
      vehiculoRepo.create({
        placa: 'PBA-9900',
        marca: 'Isuzu',
        modelo: 'Forward FTR',
        anio: 2024,
        capacidadCargaKg: 11000,
        kilometraje: 8500,
        tipo: TipoVehiculo.CAMION_CARGA,
        estado: EstadoVehiculo.DISPONIBLE,
        imagenUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
      }),
    );
    await camionRepo.save(
      camionRepo.create({
        vehiculoId: camion3.id,
        consumoLitros100Km: 26.0,
        precioLitro: 0.75,
        numeroEjes: 2,
        costoMantenimientoKm: 0.11,
      }),
    );
  } else if (!camion3.imagenUrl) {
    camion3.imagenUrl = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80';
    await vehiculoRepo.save(camion3);
  }

  // 4. Servicios completos para todas las consultas analíticas
  console.log('Poblando servicios para consultas analíticas...');

  const serviciosData = [
    {
      codigo: 'SRV-2026-001',
      clienteId: clientesGuardados[0].id,
      vehiculoId: camion1.id,
      origen: 'Quito - Centro Norte',
      destino: 'Guayaquil - Terminal Portuario',
      distanciaKm: 420,
      pesoCargaKg: 9500,
      fecha: '2026-10-25',
      horaInicio: '06:00',
      horaFinEstimada: '14:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 385.5,
      costoOperativo: 215.3,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-002',
      clienteId: clientesGuardados[0].id,
      vehiculoId: furgoneta1.id,
      origen: 'Quito - Calderón',
      destino: 'Quito - Cumbayá',
      distanciaKm: 120,
      pesoCargaKg: 2100,
      fecha: '2026-10-26',
      horaInicio: '08:00',
      horaFinEstimada: '11:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 145.0,
      costoOperativo: 45.2,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-003',
      clienteId: clientesGuardados[0].id,
      vehiculoId: camion2.id,
      origen: 'Ambato - Parque Industrial',
      destino: 'Riobamba - Mercado Mayorista',
      distanciaKm: 280,
      pesoCargaKg: 8200,
      fecha: '2026-10-27',
      horaInicio: '07:00',
      horaFinEstimada: '13:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 260.0,
      costoOperativo: 130.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-004',
      clienteId: clientesGuardados[0].id,
      vehiculoId: furgoneta1.id,
      origen: 'Quito - Sur',
      destino: 'Sangolquí - Centro',
      distanciaKm: 85,
      pesoCargaKg: 1800,
      fecha: '2026-10-28',
      horaInicio: '09:00',
      horaFinEstimada: '12:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 95.0,
      costoOperativo: 32.0,
      facturado: false,
    },
    // Cliente 2: ALFA (Septiembre alto vs Octubre bajo -> para Consulta 28 LAG)
    {
      codigo: 'SRV-2026-005',
      clienteId: clientesGuardados[1].id,
      vehiculoId: camion1.id,
      origen: 'Manta - Puerto',
      destino: 'Quito - Bodegas ALFA',
      distanciaKm: 520,
      pesoCargaKg: 11500,
      fecha: '2026-09-15',
      horaInicio: '05:00',
      horaFinEstimada: '15:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 550.0,
      costoOperativo: 280.0,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-006',
      clienteId: clientesGuardados[1].id,
      vehiculoId: camion2.id,
      origen: 'Cuenca - Parque Industrial',
      destino: 'Guayaquil - Bodegas',
      distanciaKm: 400,
      pesoCargaKg: 9000,
      fecha: '2026-09-22',
      horaInicio: '06:00',
      horaFinEstimada: '14:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 400.0,
      costoOperativo: 210.0,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-007',
      clienteId: clientesGuardados[1].id,
      vehiculoId: furgoneta2.id,
      origen: 'Guayaquil - Samborondón',
      destino: 'Durán - Centro',
      distanciaKm: 110,
      pesoCargaKg: 2400,
      fecha: '2026-10-10',
      horaInicio: '09:00',
      horaFinEstimada: '12:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 120.0,
      costoOperativo: 48.0,
      facturado: false,
    },
    // Servicios En Ejecución y Programados para completar los segmentos del Dashboard
    {
      codigo: 'SRV-2026-008',
      clienteId: clientesGuardados[2].id,
      vehiculoId: camion1.id,
      origen: 'Ibarra - Zona Franca',
      destino: 'Quito - Carcelén',
      distanciaKm: 310,
      pesoCargaKg: 7800,
      fecha: '2026-10-29',
      horaInicio: '06:30',
      horaFinEstimada: '13:00',
      estado: EstadoServicio.EN_EJECUCION,
      tarifaCalculada: 290.0,
      costoOperativo: 155.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-009',
      clienteId: clientesGuardados[3].id,
      vehiculoId: furgoneta1.id,
      origen: 'Quito - Pomasqui',
      destino: 'Tumbaco - Almacén',
      distanciaKm: 90,
      pesoCargaKg: 1950,
      fecha: '2026-10-30',
      horaInicio: '08:30',
      horaFinEstimada: '11:30',
      estado: EstadoServicio.EN_EJECUCION,
      tarifaCalculada: 110.0,
      costoOperativo: 38.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-010',
      clienteId: clientesGuardados[2].id,
      vehiculoId: camion2.id,
      origen: 'Latacunga - Centro Florícola',
      destino: 'Quito - Aeropuerto Tababela',
      distanciaKm: 150,
      pesoCargaKg: 6500,
      fecha: '2026-10-31',
      horaInicio: '10:00',
      horaFinEstimada: '14:00',
      estado: EstadoServicio.PROGRAMADO,
      tarifaCalculada: 160.0,
      costoOperativo: 80.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-011',
      clienteId: clientesGuardados[3].id,
      vehiculoId: furgoneta2.id,
      origen: 'Quito - Centro Histórico',
      destino: 'Valle de los Chillos',
      distanciaKm: 60,
      pesoCargaKg: 1500,
      fecha: '2026-11-02',
      horaInicio: '09:00',
      horaFinEstimada: '12:00',
      estado: EstadoServicio.PROGRAMADO,
      tarifaCalculada: 75.0,
      costoOperativo: 25.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-012',
      clienteId: clientesGuardados[1].id,
      vehiculoId: camion3.id,
      origen: 'Quito - Carcelén',
      destino: 'Otavalo - Plaza de Ponchos',
      distanciaKm: 110,
      pesoCargaKg: 4200,
      fecha: '2026-10-24',
      horaInicio: '07:00',
      horaFinEstimada: '10:30',
      estado: EstadoServicio.CANCELADO,
      tarifaCalculada: 135.0,
      costoOperativo: 55.0,
      facturado: false,
    },
    // Servicios completados pendientes de facturar para Agroexportadora Los Andes (Cliente 3)
    {
      codigo: 'SRV-2026-013',
      clienteId: clientesGuardados[2].id,
      vehiculoId: camion1.id,
      origen: 'Machala - Puerto Bolívar',
      destino: 'Guayaquil - Terminal Carga',
      distanciaKm: 190,
      pesoCargaKg: 8500,
      fecha: '2026-10-22',
      horaInicio: '06:00',
      horaFinEstimada: '10:30',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 310.0,
      costoOperativo: 140.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-014',
      clienteId: clientesGuardados[2].id,
      vehiculoId: camion2.id,
      origen: 'Quevedo - Bodega Central',
      destino: 'Santo Domingo - Centro',
      distanciaKm: 105,
      pesoCargaKg: 6200,
      fecha: '2026-10-23',
      horaInicio: '08:00',
      horaFinEstimada: '11:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 180.0,
      costoOperativo: 75.0,
      facturado: false,
    },
    // Servicios completados pendientes de facturar para Farmacéutica Continental (Cliente 4)
    {
      codigo: 'SRV-2026-015',
      clienteId: clientesGuardados[3].id,
      vehiculoId: furgoneta1.id,
      origen: 'Quito - Parque Bicentenario',
      destino: 'Cayambe - Distribución',
      distanciaKm: 75,
      pesoCargaKg: 1800,
      fecha: '2026-10-24',
      horaInicio: '09:00',
      horaFinEstimada: '11:30',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 145.0,
      costoOperativo: 52.0,
      facturado: false,
    },
    {
      codigo: 'SRV-2026-016',
      clienteId: clientesGuardados[3].id,
      vehiculoId: furgoneta2.id,
      origen: 'Quito - Villaflora',
      destino: 'Machachi - Almacén',
      distanciaKm: 45,
      pesoCargaKg: 1200,
      fecha: '2026-10-25',
      horaInicio: '10:00',
      horaFinEstimada: '12:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 90.0,
      costoOperativo: 30.0,
      facturado: false,
    },
    // Servicio completado pendiente de facturar para Distribuidora ALFA (Cliente 2)
    {
      codigo: 'SRV-2026-017',
      clienteId: clientesGuardados[1].id,
      vehiculoId: camion1.id,
      origen: 'Guayaquil - Vía a la Costa',
      destino: 'Salinas - Bodega Marina',
      distanciaKm: 140,
      pesoCargaKg: 7000,
      fecha: '2026-10-26',
      horaInicio: '07:30',
      horaFinEstimada: '11:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 220.0,
      costoOperativo: 95.0,
      facturado: false,
    },
    // Servicios ya facturados para comprobantes iniciales
    {
      codigo: 'SRV-2026-018',
      clienteId: clientesGuardados[2].id, // Agroexportadora Los Andes
      vehiculoId: camion2.id,
      origen: 'Riobamba - Planta Procesadora',
      destino: 'Guayaquil - Terminal Portuario',
      distanciaKm: 230,
      pesoCargaKg: 8900,
      fecha: '2026-10-20',
      horaInicio: '05:30',
      horaFinEstimada: '10:30',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 420.0,
      costoOperativo: 180.0,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-019',
      clienteId: clientesGuardados[3].id, // Farmacéutica Continental
      vehiculoId: furgoneta1.id,
      origen: 'Quito - Centro Logístico Norte',
      destino: 'Ambato - Distribuidora Central',
      distanciaKm: 135,
      pesoCargaKg: 1900,
      fecha: '2026-10-21',
      horaInicio: '08:00',
      horaFinEstimada: '11:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 235.0,
      costoOperativo: 62.0,
      facturado: true,
    },
    {
      codigo: 'SRV-2026-020',
      clienteId: clientesGuardados[0].id, // Corporación Favorita
      vehiculoId: camion1.id,
      origen: 'Quito - Terminal Carga',
      destino: 'Ibarra - Centro Comercial',
      distanciaKm: 115,
      pesoCargaKg: 7500,
      fecha: '2026-10-22',
      horaInicio: '07:00',
      horaFinEstimada: '10:00',
      estado: EstadoServicio.COMPLETADO,
      tarifaCalculada: 310.0,
      costoOperativo: 125.0,
      facturado: true,
    },
  ];

  for (const sData of serviciosData) {
    let srv = await servicioRepo.findOne({ where: { codigo: sData.codigo } });
    if (!srv) {
      srv = await servicioRepo.save(servicioRepo.create(sData));
    }
  }

  // Asegurar auditoría completa de estados para cada servicio
  console.log('Verificando auditoría de estados...');
  const todosServicios = await servicioRepo.find();
  for (const s of todosServicios) {
    const historialCount = await historialRepo.count({ where: { servicioId: s.id } });
    if (historialCount === 0) {
      if (s.estado === EstadoServicio.PROGRAMADO) {
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: 'REGISTRO',
            estadoNuevo: EstadoServicio.PROGRAMADO,
            usuarioId: admin.id,
          }),
        );
      } else if (s.estado === EstadoServicio.EN_EJECUCION) {
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: 'REGISTRO',
            estadoNuevo: EstadoServicio.PROGRAMADO,
            usuarioId: admin.id,
          }),
        );
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: EstadoServicio.PROGRAMADO,
            estadoNuevo: EstadoServicio.EN_EJECUCION,
            usuarioId: operador.id,
          }),
        );
      } else if (s.estado === EstadoServicio.COMPLETADO) {
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: 'REGISTRO',
            estadoNuevo: EstadoServicio.PROGRAMADO,
            usuarioId: admin.id,
          }),
        );
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: EstadoServicio.PROGRAMADO,
            estadoNuevo: EstadoServicio.EN_EJECUCION,
            usuarioId: operador.id,
          }),
        );
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: EstadoServicio.EN_EJECUCION,
            estadoNuevo: EstadoServicio.COMPLETADO,
            usuarioId: operador.id,
          }),
        );
      } else if (s.estado === EstadoServicio.CANCELADO) {
        await historialRepo.save(
          historialRepo.create({
            servicioId: s.id,
            estadoAnterior: EstadoServicio.PROGRAMADO,
            estadoNuevo: EstadoServicio.CANCELADO,
            usuarioId: admin.id,
          }),
        );
      }
    }
  }

  // 5. Facturas de prueba iniciales para todas las empresas
  console.log('Poblando facturas iniciales...');
  const facturaRepo = AppDataSource.getRepository(Factura);
  const detalleRepo = AppDataSource.getRepository(DetalleFactura);

  // Factura 1: Corporación Favorita S.A.
  let fac1 = await facturaRepo.findOne({ where: { codigo: 'FAC-2026-0001' } });
  if (!fac1) {
    fac1 = await facturaRepo.save(
      facturaRepo.create({
        codigo: 'FAC-2026-0001',
        clienteId: clientesGuardados[0].id,
        subtotal: 530.5,
        recargos: 22.83,
        descuento: 0.0,
        impuesto: 83.0,
        total: 636.33,
      }),
    );
    const srv1 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-001' } });
    const srv2 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-002' } });
    if (srv1) await detalleRepo.save(detalleRepo.create({ facturaId: fac1.id, servicioId: srv1.id, tarifa: 385.5, recargos: 22.83 }));
    if (srv2) await detalleRepo.save(detalleRepo.create({ facturaId: fac1.id, servicioId: srv2.id, tarifa: 145.0, recargos: 0.0 }));
  }

  // Factura 2: Distribuidora Importadora ALFA
  let fac2 = await facturaRepo.findOne({ where: { codigo: 'FAC-2026-0002' } });
  if (!fac2) {
    fac2 = await facturaRepo.save(
      facturaRepo.create({
        codigo: 'FAC-2026-0002',
        clienteId: clientesGuardados[1].id,
        subtotal: 950.0,
        recargos: 57.0,
        descuento: 47.5,
        impuesto: 143.93,
        total: 1103.43,
      }),
    );
    const srv5 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-005' } });
    const srv6 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-006' } });
    if (srv5) await detalleRepo.save(detalleRepo.create({ facturaId: fac2.id, servicioId: srv5.id, tarifa: 550.0, recargos: 33.0 }));
    if (srv6) await detalleRepo.save(detalleRepo.create({ facturaId: fac2.id, servicioId: srv6.id, tarifa: 400.0, recargos: 24.0 }));
  }

  // Factura 3: Agroexportadora Los Andes
  let fac3 = await facturaRepo.findOne({ where: { codigo: 'FAC-2026-0003' } });
  if (!fac3) {
    fac3 = await facturaRepo.save(
      facturaRepo.create({
        codigo: 'FAC-2026-0003',
        clienteId: clientesGuardados[2].id,
        subtotal: 420.0,
        recargos: 25.2,
        descuento: 0.0,
        impuesto: 66.78,
        total: 511.98,
      }),
    );
    const srv18 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-018' } });
    if (srv18) await detalleRepo.save(detalleRepo.create({ facturaId: fac3.id, servicioId: srv18.id, tarifa: 420.0, recargos: 25.2 }));
  }

  // Factura 4: Farmacéutica Continental
  let fac4 = await facturaRepo.findOne({ where: { codigo: 'FAC-2026-0004' } });
  if (!fac4) {
    fac4 = await facturaRepo.save(
      facturaRepo.create({
        codigo: 'FAC-2026-0004',
        clienteId: clientesGuardados[3].id,
        subtotal: 235.0,
        recargos: 0.0,
        descuento: 0.0,
        impuesto: 35.25,
        total: 270.25,
      }),
    );
    const srv19 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-019' } });
    if (srv19) await detalleRepo.save(detalleRepo.create({ facturaId: fac4.id, servicioId: srv19.id, tarifa: 235.0, recargos: 0.0 }));
  }

  // Factura 5: Corporación Favorita S.A.
  let fac5 = await facturaRepo.findOne({ where: { codigo: 'FAC-2026-0005' } });
  if (!fac5) {
    fac5 = await facturaRepo.save(
      facturaRepo.create({
        codigo: 'FAC-2026-0005',
        clienteId: clientesGuardados[0].id,
        subtotal: 310.0,
        recargos: 18.6,
        descuento: 0.0,
        impuesto: 49.29,
        total: 377.89,
      }),
    );
    const srv20 = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-020' } });
    if (srv20) await detalleRepo.save(detalleRepo.create({ facturaId: fac5.id, servicioId: srv20.id, tarifa: 310.0, recargos: 18.6 }));
  }

  console.log('✅ Seeding completado exitosamente.');
  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
