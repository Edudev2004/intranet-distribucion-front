export interface Almacen {
  idAlmacen: number;
  idSede: number;
  sede: string;
  nombre: string;
  idTipoAlmacen: number;
  tipoAlmacen: string;
  capacidadMaxima: number;
  ubicacion: string | null;
  activo: boolean;
}

export interface AlmacenRequest {
  idSede: number | null;
  nombre: string;
  idTipoAlmacen: number | null;
  capacidadMaxima: number | null;
  ubicacion: string;
  activo: boolean;
}

export interface TipoAlmacen {
  idTipoAlmacen: number;
  nombre: string;
}

export interface SedeOpcion {
  idSede: number;
  nombre: string;
}

export interface ProductoAlmacen {
  idProducto: number;
  codigo: string;
  producto: string;
  categoria: string;
  stockActual: number;
}