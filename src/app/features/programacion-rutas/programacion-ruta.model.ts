export interface ProgramacionRuta {
  idProgramacion: number;
  idRuta: number;
  nombreRuta?: string;
  nombreZona?: string;
  idVehiculo: number;
  placaVehiculo?: string;
  modeloVehiculo?: string;
  capacidadVehiculoKg?: number;
  idConductor: number;
  nombreConductor?: string;
  dniConductor?: string;
  licenciaConductor?: string;
  inicioProgramado: string;
  finProgramado?: string;
  inicioReal?: string;
  finReal?: string;
  idEstadoProgramacion: number;
  estadoProgramacion?: string;
  pesoOcupadoKg?: number;
  porcentajeOcupacion?: number;
  totalPedidos?: number;
}

export interface ProgramacionRutaRequest {
  idRuta: number;
  idVehiculo: number;
  idConductor: number;
  inicioProgramado: string;
  finProgramado?: string;
}

export interface PedidoDisponibleAsignacion {
  idPedido: number;
  idCliente: number;
  cliente: string;
  numeroDocumentoCliente: string;
  direccionEntrega: string;
  zonaCliente: string;
  idAlmacen?: number;
  almacen?: string;
  idEstadoPedido: number;
  estado: string;
  fechaPedido: string;
  fechaEntregaSolicitada?: string;
  pesoTotalKg: number;
  importeTotal: number;
}

export interface ResumenCargaRuta {
  idProgramacion: number;
  idVehiculo: number;
  placaVehiculo: string;
  modeloVehiculo: string;
  capacidadMaximaKg: number;
  pesoOcupadoKg: number;
  pesoDisponibleKg: number;
  porcentajeOcupacion: number;
  totalPedidos: number;
}

export interface AsignarPedidosRequest {
  idPedidos: number[];
}

export interface AsignacionPedidosResponse {
  idProgramacion: number;
  idVehiculo: number;
  vehiculoPlaca: string;
  capacidadVehiculoKg: number;
  pesoTotalAsignadoKg: number;
  pesoDisponibleKg: number;
  porcentajeOcupacion: number;
  cantidadPedidosAsignados: number;
  mensaje: string;
}

export interface RutaOpcion {
  idRuta: number;
  nombre: string;
  zona?: { idZona: number; nombre: string };
  activo: boolean;
}

export interface VehiculoOpcion {
  idVehiculo: number;
  placa: string;
  marca?: string;
  modelo?: string;
  capacidadKg?: number;
  activo: boolean;
}

export interface ConductorOpcion {
  idConductor: number;
  nombres: string;
  apellidos: string;
  dni: string;
  nroLicencia: string;
  activo: boolean;
}
