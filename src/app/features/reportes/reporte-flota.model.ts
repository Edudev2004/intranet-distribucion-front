export interface ProductividadVehiculo {
  idVehiculo: number;
  placa: string;
  marca?: string;
  modelo?: string;
  capacidadKg?: number;
  rutasAsignadas: number;
  rutasCompletadas: number;
  tiempoTotalMinutos: number;
  tiempoPromedioMinutos: number;
  tiempoPromedioFormateado: string;
  tasaCumplimientoPct: number;
}

export interface ProductividadConductor {
  idConductor: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  nroLicencia: string;
  rutasAsignadas: number;
  rutasCompletadas: number;
  tiempoTotalMinutos: number;
  tiempoPromedioMinutos: number;
  tiempoPromedioFormateado: string;
  tasaCumplimientoPct: number;
}

export interface DetalleRutaProductividad {
  idProgramacion: number;
  ruta: string;
  vehiculoPlaca: string;
  conductorNombre: string;
  inicioProgramado: string;
  finProgramado?: string;
  inicioReal?: string;
  finReal?: string;
  duracionMinutos?: number;
  duracionFormateada: string;
  idEstadoProgramacion: number;
  estadoProgramacion: string;
  completada: boolean;
}

export interface ReporteProductividadFlota {
  totalRutasProgramadas: number;
  totalRutasCompletadas: number;
  tasaCumplimientoGeneralPct: number;
  tiempoPromedioGeneralMinutos: number;
  tiempoPromedioGeneralFormateado: string;
  vehiculoMasProductivo?: string;
  conductorMasProductivo?: string;
  metricasVehiculos: ProductividadVehiculo[];
  metricasConductores: ProductividadConductor[];
  detallesRutas: DetalleRutaProductividad[];
}

export interface FiltrosReporteFlota {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idVehiculo?: number | null;
  idConductor?: number | null;
}
