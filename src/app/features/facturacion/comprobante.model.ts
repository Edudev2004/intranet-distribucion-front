export interface Comprobante {
  idComprobante: number;
  idPedido: number;
  idTipoComprobante: number;
  tipoComprobante: string;
  serie: string;
  numero: number;
  numeroCompleto: string;
  fechaEmision: string;
  idUsuario: number;
  username: string;
  nombreUsuario: string;
}

export interface ComprobanteRequest {
  idPedido: number;
  idTipoComprobante: number;
  serie: string | null;
  idUsuario: number;
}

export interface ComprobanteForm {
  idPedido: number | null;
  idTipoComprobante: number | null;
  serie: string;
}

export interface TipoComprobante {
  idTipoComprobante: number;
  nombre: string;
}

export interface PedidoOpcion {
  idPedido: number;
  cliente: string;
  estado: string;
}
