export interface ReporteEntregaItem {
  idEntrega: number;
  idPedido: number;
  cliente: string;
  direccion: string;
  estadoEntrega: string;
  horaEstimada?: string | null;
  horaEntregaReal?: string | null;
  cumplimiento: string; // "A TIEMPO" | "CON RETRASO" | "PENDIENTE" | "NO ENTREGADO"
  notas?: string | null;
}

export interface ReporteEntrega {
  generadoEn: string;
  fechaInicioFiltro?: string | null;
  fechaFinFiltro?: string | null;
  estadoFiltro?: string | null;
  totalEntregas: number;
  totalATiempo: number;
  totalConRetraso: number;
  totalPendientes: number;
  porcentajeCumplimiento: number;
  items: ReporteEntregaItem[];
}

export interface FiltrosReporteEntrega {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idEstado?: number | null;
}
