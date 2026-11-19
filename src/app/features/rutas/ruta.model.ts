export interface RutaResponseDTO {
  idRuta: number;
  nombre: string;
  idZona: number;
  nombreZona: string;
  activo: boolean;
}

export interface RutaRequestDTO {
  nombre: string;
  idZona: number;
  activo?: boolean;
}
