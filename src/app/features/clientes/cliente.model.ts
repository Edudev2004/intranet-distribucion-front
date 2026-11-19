export interface TipoDocumentoDTO {
  idTipoDocumento: number;
  nombre: string;
}

export interface ClienteResponseDTO {
  idCliente: number;
  idTipoDocumento: number;
  tipoDocumentoNombre?: string;
  numeroDocumento: string;
  nombreRazonSocial: string;
  direccion: string;
  telefono?: string;
  correo?: string;
  idZona?: number;
  zonaNombre?: string;
  activo: boolean;
}

export interface ClienteRequestDTO {
  idTipoDocumento: number;
  numeroDocumento: string;
  nombreRazonSocial: string;
  direccion: string;
  telefono?: string;
  correo?: string;
  idZona?: number;
  activo?: boolean;
}

export interface ClienteOpcionDTO {
  idCliente: number;
  nombreRazonSocial: string;
  numeroDocumento: string;
  tipoDocumento: string;
}
