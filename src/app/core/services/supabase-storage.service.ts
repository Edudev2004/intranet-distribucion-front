import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EvidenciaPreset {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  tipo: 'entrega' | 'incidencia';
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseStorageService {
  readonly bucketName = 'evidencias-entregas';
  readonly supabaseProjectUrl = 'https://aejheugcxtmeuuyfkpjo.supabase.co';

  readonly presets: EvidenciaPreset[] = [
    {
      id: 'pod-guia-firmada',
      nombre: 'Guía de Remisión Firmada & Sellada',
      descripcion: 'Copia física con sello de almacén y firma de recepción conforme',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      tipo: 'entrega'
    },
    {
      id: 'pod-paquete-recepcion',
      nombre: 'Paquete en Puerta / Recepción',
      descripcion: 'Mercadería embalada e íntegra entregada en domicilio del cliente',
      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      tipo: 'entrega'
    },
    {
      id: 'inc-local-cerrado',
      nombre: 'Local Comercial Cerrado / Ausente',
      descripcion: 'Fachada con cortina metálica cerrada en el horario programado',
      url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      tipo: 'incidencia'
    },
    {
      id: 'inc-mercaderia-danada',
      nombre: 'Mercadería / Empaque Dañado',
      descripcion: 'Caja abollada o rotura observada al momento de la descarga',
      url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
      tipo: 'incidencia'
    }
  ];

  /**
   * Convierte un archivo local a DataURL para vista previa y almacenamiento inmediato
   */
  procesarArchivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Genera la URL pública estimada para un archivo subido a Supabase Storage
   */
  obtenerUrlPublica(nombreArchivo: string): string {
    return `${this.supabaseProjectUrl}/storage/v1/object/public/${this.bucketName}/${nombreArchivo}`;
  }

  obtenerPresetsPorTipo(tipo: 'entrega' | 'incidencia'): EvidenciaPreset[] {
    return this.presets.filter(p => p.tipo === tipo);
  }
}
