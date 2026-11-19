export interface DashboardKpiResponseDTO {
  totalPedidos: number;
  pedidosAprobados: number;
  pedidosPendientes: number;
  totalEntregasExitosas: number;
  totalEntregasConIncidencia: number;
  vehiculosEnRuta: number;
  conductoresActivos: number;
}

export interface RutaActivaDTO {
  idProgramacion: number;
  idRuta: number;
  idVehiculo: number;
  idConductor: number;
  inicioProgramado: string;
  finProgramado: string;
  inicioReal?: string;
  finReal?: string;
  idEstadoProgramacion: number;
  estadoProgramacion: string;
}
