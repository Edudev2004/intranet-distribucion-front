export interface Mantenimiento {
  idMantenimiento: number;
  idVehiculo: number;
  placa: string;
  estadoVehiculo: string;
  idTipoMantenimiento: number;
  tipoMantenimiento: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string | null;
  costo: number | null;
  vigente: boolean;
}

export interface MantenimientoRequest {
  idVehiculo: number | null;
  idTipoMantenimiento: number | null;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string;
  costo: number | null;
}

export interface TipoMantenimiento {
  idTipoMantenimiento: number;
  nombre: string;
}

export interface VehiculoOpcion {
  idVehiculo: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  capacidadKg: number;
  estado: string;
}