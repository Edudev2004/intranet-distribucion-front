export interface Producto {
  idProducto: number;
  codigo: string;
  nombre: string;
  idCategoria: number;
  categoria?: string;
  idUnidad: number;
  unidad?: string;
  stockMinimo: number;
  pesoKg: number;
  precioUnitario: number;
  activo: boolean;
}

export interface ProductoRequest {
  codigo: string;
  nombre: string;
  idCategoria: number | null;
  idUnidad: number | null;
  stockMinimo: number | null;
  pesoKg: number | null;
  precioUnitario: number | null;
  activo: boolean;
}

export interface CategoriaOpcion {
  idCategoria: number;
  nombre: string;
}

export interface UnidadOpcion {
  idUnidad: number;
  codigo: string;
  nombre: string;
}