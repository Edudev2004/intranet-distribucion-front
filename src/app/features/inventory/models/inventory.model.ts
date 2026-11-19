export interface InventarioItem {
  idAlmacen: number;
  almacen: string;
  sede: string;
  idProducto: number;
  codigo: string;
  producto: string;
  categoria: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  precioUnitario: number;
  bajoStock: boolean;
  nivelAlerta: 'NORMAL' | 'BAJO_STOCK' | 'SIN_STOCK' | string;
  mensajeAlerta?: string;
}

export interface InventarioConsulta {
  items: InventarioItem[];
  totalProductos: number;
  totalBajoStock: number;
  totalSinStock: number;
  almacenFiltro?: string;
  categoriaFiltro?: string;
}

export interface AlertaStock {
  idAlmacen: number;
  almacen: string;
  sede: string;
  idProducto: number;
  codigo: string;
  producto: string;
  categoria: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  diferencia: number;
  nivelAlerta: string;
  mensaje: string;
}

export interface TipoMovimiento {
  idTipoMovimiento: number;
  nombre: string;
  naturaleza: 'E' | 'S';
}

export interface MovimientoItemRequest {
  idProducto: number;
  cantidad: number;
}

export interface MovimientoRequest {
  idAlmacen: number;
  idTipoMovimiento: number;
  idPedido?: number;
  observacion?: string;
  items: MovimientoItemRequest[];
}

export interface AjusteStockRequest {
  idAlmacen: number;
  idProducto: number;
  nuevoStock: number;
  motivo?: string;
}

export interface MovimientoDetalleResponse {
  idProducto: number;
  codigo: string;
  producto: string;
  cantidad: number;
  stockResultante: number;
  alertaStock: boolean;
  mensajeAlerta?: string;
}

export interface MovimientoResponse {
  idMovimiento: number;
  idAlmacen: number;
  almacen: string;
  idTipoMovimiento: number;
  tipoMovimiento: string;
  naturaleza: 'E' | 'S';
  idUsuario: number;
  usuario: string;
  idPedido?: number;
  fecha: string;
  observacion?: string;
  items: MovimientoDetalleResponse[];
  contieneAlertas: boolean;
}

export interface InventarioFiltros {
  idAlmacen?: number;
  idCategoria?: number;
  soloBajoStock?: boolean;
  buscar?: string;
}
