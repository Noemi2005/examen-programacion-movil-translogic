import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
// Seed script for reproducible test data
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
  }

  // 4. Servicios de prueba
  console.log('Poblando servicios de prueba...');
  const servicioPrueba = await servicioRepo.findOne({ where: { codigo: 'SRV-2026-001' } });
  if (!servicioPrueba && camion1) {
    const srv1 = await servicioRepo.save(
      servicioRepo.create({
        codigo: 'SRV-2026-001',
        clienteId: clientesGuardados[0].id,
        vehiculoId: camion1.id,
        origen: 'Quito - Centro Logístico Norte',
        destino: 'Guayaquil - Terminal Portuario',
        distanciaKm: 420,
        pesoCargaKg: 9500,
        fecha: '2026-10-25',
        horaInicio: '06:00',
        horaFinEstimada: '14:00',
        estado: EstadoServicio.COMPLETADO,
        tarifaCalculada: 385.5,
        costoOperativo: 215.3,
        facturado: false,
      }),
    );

    await historialRepo.save(
      historialRepo.create({
        servicioId: srv1.id,
        estadoAnterior: 'N/A',
        estadoNuevo: EstadoServicio.PROGRAMADO,
        usuarioId: admin.id,
      }),
    );
    await historialRepo.save(
      historialRepo.create({
        servicioId: srv1.id,
        estadoAnterior: EstadoServicio.PROGRAMADO,
        estadoNuevo: EstadoServicio.COMPLETADO,
        usuarioId: operador.id,
      }),
    );
  }

  console.log('✅ Seeding completado exitosamente.');
  await AppDataSource.destroy();
}

runSeed().catch((err) => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
