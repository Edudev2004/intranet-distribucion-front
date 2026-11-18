export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  username: string;
  correo: string;
  idRol: number | null;
  rol: string | null;
  idSede: number | null;
  sede: string | null;
  activo: boolean;
  intentosFallidos: number;
  bloqueado: boolean;
  ultimoAcceso: string | null;
  creadoEn: string;
}

export interface UsuarioRequest {
  nombres: string;
  apellidos: string;
  username: string;
  correo: string;
  password: string | null;
  idRol: number | null;
  idSede: number | null;
}

export interface RolOpcion {
  id: number;
  nombre: string;
}

export interface SedeOpcion {
  idSede: number;
  nombre: string;
  activo: boolean;
}
