export interface InventarioReporteItem {
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
  bajoStock: boolean;
}

export interface ReporteInventario {
  generadoEn: string;
  almacenFiltro: string;
  categoriaFiltro: string;
  totalRegistros: number;
  totalBajoStock: number;
  items: InventarioReporteItem[];
}

export interface FiltrosReporte {
  idAlmacen: number | null;
  idCategoria: number | null;
}

export type FormatoReporte = 'pdf' | 'excel';

export interface AlmacenOpcion {
  idAlmacen: number;
  nombre: string;
}

export interface CategoriaOpcion {
  idCategoria: number;
  nombre: string;
}
