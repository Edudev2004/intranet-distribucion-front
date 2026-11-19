export interface ReportePedidoItem {
  idPedido: number;
  cliente: string;
  almacen: string;
  idEstadoPedido: number;
  estado: string;
  fechaPedido: string;
  total: number;
}

export interface ReportePedido {
  generadoEn: string;
  fechaInicioFiltro?: string | null;
  fechaFinFiltro?: string | null;
  estadoFiltro?: string | null;
  clienteFiltro?: string | null;
  totalPedidos: number;
  montoTotalGeneral: number;
  items: ReportePedidoItem[];
}

export interface FiltrosReportePedido {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idEstado?: number | null;
  idCliente?: number | null;
}

export interface ClienteOpcionReporte {
  idCliente: number;
  nombre: string;
  razonSocial?: string;
}

export interface EstadoPedidoOpcion {
  idEstado: number;
  nombre: string;
}
