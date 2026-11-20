import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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
  readonly config = environment.supabase;

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
   * Sube un archivo al bucket correspondiente de Supabase Storage.
   * Si la anonKey aún no se ha colocado en environment.ts, procesa el archivo a DataURL
   * para vista previa instantánea y funcionamiento continuo del sistema.
   */
  async subirArchivo(file: File, bucket = 'sedes'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${environment.apiUrl}/storage/upload?bucket=${bucket}`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          return data.url;
        }
      }
      console.warn('Fallo en endpoint backend de almacenamiento, probando conexion directa...');
    } catch (err) {
      console.warn('Error al subir via backend:', err);
    }

    if (this.config.anonKey && this.config.anonKey.trim() !== '') {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const uploadUrl = `${this.config.url}/storage/v1/object/${bucket}/${fileName}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.anonKey}`,
            'apikey': this.config.anonKey,
            'Content-Type': file.type || 'image/jpeg'
          },
          body: file
        });

        if (response.ok) {
          return `${this.config.url}/storage/v1/object/public/${bucket}/${fileName}`;
        }
        console.warn('Fallo en Supabase Storage REST API, usando fallback de DataURL:', await response.text());
      } catch (err) {
        console.warn('Error al conectar con Supabase Storage, usando fallback local:', err);
      }
    }

    // Fallback: procesa a DataURL para previsualización y persistencia inmediata
    return this.procesarArchivo(file);
  }

  /**
   * Convierte un archivo local a DataURL para vista previa inmediata
   */
  procesarArchivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  obtenerUrlPublica(nombreArchivo: string, bucket = 'sedes'): string {
    return `${this.config.url}/storage/v1/object/public/${bucket}/${nombreArchivo}`;
  }

  obtenerPresetsPorTipo(tipo: 'entrega' | 'incidencia'): EvidenciaPreset[] {
    return this.presets.filter(p => p.tipo === tipo);
  }
}
