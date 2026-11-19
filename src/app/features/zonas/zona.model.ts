export interface ZonaResponseDTO {
  idZona: number;
  nombre: string;
  descripcion?: string;
}

export interface ZonaRequestDTO {
  nombre: string;
  descripcion?: string;
}
