export interface EstadoVehiculo {
  idEstadoVehiculo: number;
  nombre: string;
}

export interface Vehiculo {
  idVehiculo: number;
  placa: string;
  marca?: string;
  modelo?: string;
  capacidadKg: number;
  idEstadoVehiculo: number;
  nombreEstado: string;
}

export interface VehiculoRequest {
  placa: string;
  marca?: string;
  modelo?: string;
  capacidadKg: number;
  idEstadoVehiculo: number;
}

export interface Conductor {
  idConductor: number;
  idUsuario?: number | null;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  nroLicencia: string;
  categoriaLicencia: string;
  fechaVencLicencia: string; // ISO YYYY-MM-DD
  licenciaVencida: boolean;
  telefono?: string | null;
  activo: boolean;
}

export interface ConductorRequest {
  idUsuario?: number | null;
  nombres: string;
  apellidos: string;
  dni: string;
  nroLicencia: string;
  categoriaLicencia: string;
  fechaVencLicencia: string;
  telefono?: string | null;
  activo?: boolean;
}
