export interface Entrega {
  idEntrega: number;
  idProgramacion: number;
  idPedido: number;
  idEstadoEntrega: number;
  estadoEntrega: string;
  ordenVisita?: number;
  horaEstimada?: string;
  horaEntregaReal?: string;
  fotoEntregaUrl?: string;
  fotoGuiaUrl?: string;
  notas?: string;
  cliente?: string;
  direccionCliente?: string;
  telefonoCliente?: string;
}

export interface ActualizarEntregaRequest {
  idEstadoEntrega: number;
  fotoEntregaUrl?: string;
  fotoGuiaUrl?: string;
  notas?: string;
}

export enum EstadoEntregaId {
  PENDIENTE = 1,
  EN_RUTA = 2,
  ENTREGADO = 3,
  NO_ENTREGADO = 4
}
