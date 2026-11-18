export interface Incidencia {
  idIncidencia: number;
  idEntrega: number;
  idPedido: number;
  idProgramacion: number;
  idTipoIncidencia: number;
  tipoIncidencia: string;
  comentario: string | null;
  fechaHora: string;
  idUsuario: number;
  username: string;
  nombreUsuario: string;
}

export interface IncidenciaRequest {
  idEntrega: number;
  idTipoIncidencia: number;
  comentario: string;
  idUsuario: number;
}

export interface IncidenciaForm {
  idEntrega: number | null;
  idTipoIncidencia: number | null;
  comentario: string;
}

export interface TipoIncidencia {
  idTipoIncidencia: number;
  nombre: string;
}

export interface PedidoOpcion {
  idPedido: number;
  cliente: string;
}
