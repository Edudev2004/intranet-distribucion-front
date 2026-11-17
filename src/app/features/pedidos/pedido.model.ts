export interface PedidoResumen {
  idPedido: number;
  cliente: string;
  almacen: string;
  idEstadoPedido: number;
  estado: string;
  fechaPedido: string;
  total: number;
}

export interface DetallePedido {
  idProducto: number;
  codigo: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoDetalle {
  idPedido: number;
  idCliente: number;
  cliente: string;
  idAlmacen: number;
  almacen: string;
  idEstadoPedido: number;
  estado: string;
  fechaPedido: string;
  fechaEntregaSolicitada: string | null;
  observacion: string | null;
  total: number;
  detalles: DetallePedido[];
}

export interface ClienteOpcion {
  idCliente: number;
  nombre: string;
  documento: string;
}

export interface AlmacenOpcion {
  idAlmacen: number;
  nombre: string;
  activo: boolean;
}

export interface ProductoDisponible {
  idProducto: number;
  codigo: string;
  producto: string;
  precioUnitario: number;
  stockActual: number;
}

export interface LineaPedido {
  producto: ProductoDisponible;
  cantidad: number;
}

export interface PedidoRequest {
  idCliente: number | null;
  idAlmacen: number | null;
  fechaEntregaSolicitada: string | null;
  observacion: string;
  detalles: { idProducto: number; cantidad: number }[];
}