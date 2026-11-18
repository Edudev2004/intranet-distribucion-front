export interface ProgramacionRuta {
  idProgramacion?: number;
  idRuta: number;
  idVehiculo: number;
  idConductor: number;
  inicioProgramado: string;
  finProgramado: string;
  inicioReal?: string;
  finReal?: string;
  idEstadoProgramacion?: number;
  estadoProgramacion?: string;
}