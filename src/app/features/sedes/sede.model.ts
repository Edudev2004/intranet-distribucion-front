export interface Sede {
  idSede: number;
  nombre: string;
  direccion: string;
  idResponsable: number | null;
  nombreResponsable: string | null;
  correoResponsable: string | null;
  activo: boolean;
  totalUsuarios: number;
  totalAlmacenes: number;
  fotoUrl?: string;
}

export interface SedeRequest {
  nombre: string;
  direccion: string;
  idResponsable: number | null;
  activo?: boolean;
  fotoUrl?: string;
}

export interface ResponsableSede {
  idUsuario: number;
  nombreCompleto: string;
  username: string;
  correo: string;
  rol: string;
}
