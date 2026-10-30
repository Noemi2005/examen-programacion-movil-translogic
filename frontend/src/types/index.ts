export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  OPERADOR = 'OPERADOR',
}

export enum TipoVehiculo {
  CAMION_CARGA = 'CAMION_CARGA',
  FURGONETA_ELECTRICA = 'FURGONETA_ELECTRICA',
}

export enum EstadoVehiculo {
  DISPONIBLE = 'DISPONIBLE',
  EN_SERVICIO = 'EN_SERVICIO',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

export enum EstadoServicio {
  PROGRAMADO = 'PROGRAMADO',
  EN_EJECUCION = 'EN_EJECUCION',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface Cliente {
  id: string;
  identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface CamionCarga {
  id: string;
  consumoLitros100Km: number;
  precioLitro: number;
  numeroEjes: number;
  costoMantenimientoKm: number;
}

export interface FurgonetaElectrica {
  id: string;
  capacidadBateriaKWh: number;
  consumoKWh100Km: number;
  costoKWh: number;
  autonomiaKm: number;
  porcentajeBateria: number;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidadCargaKg: number;
  kilometraje: number;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  imagenUrl?: string;
  camionCarga?: CamionCarga;
  furgonetaElectrica?: FurgonetaElectrica;
}

export interface HistorialEstado {
  id: string;
  servicioId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: string;
  usuario?: Usuario;
}

export interface ServicioTransporte {
  id: string;
  codigo: string;
  clienteId: string;
  cliente?: Cliente;
  vehiculoId?: string;
  vehiculo?: Vehiculo;
  origen: string;
  destino: string;
  distanciaKm: number;
  pesoCargaKg: number;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  estado: EstadoServicio;
  recargaPlanificada: boolean;
  tarifaCalculada: number;
  costoOperativo: number;
  facturado: boolean;
  historialEstados?: HistorialEstado[];
}

export interface DetalleFactura {
  id: string;
  facturaId: string;
  servicioId: string;
  servicio?: ServicioTransporte;
  tarifa: number;
  recargos: number;
}

export interface Factura {
  id: string;
  codigo: string;
  clienteId: string;
  cliente?: Cliente;
  fecha: string;
  subtotal: number;
  recargos: number;
  descuento: number;
  impuesto: number;
  total: number;
  detalles?: DetalleFactura[];
}

export interface SimulacionTarifaResponse {
  costoDirecto: number;
  costoOperativo: number;
  tarifaBase: number;
  recargos: number;
  tarifaFinal: number;
  autonomiaDisponibleKm?: number;
  recargoAplicadoDescripcion?: string;
}

export interface DashboardMetrics {
  kpi: {
    ingresos: number;
    costosOperativos: number;
    utilidad: number;
    margenPorcentaje: number;
    serviciosCompletados: number;
  };
  serviciosPorEstado: { estado: string; cantidad: string }[];
  distribucionTipo: {
    tipoVehiculo: string;
    totalServicios: string;
    ingresos: string;
    costos: string;
  }[];
  evolucionMensual: {
    periodo: string;
    ingresos: string;
    costos: string;
    utilidad: string;
  }[];
}
