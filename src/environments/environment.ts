export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  supabase: {
    url: 'https://aejheugcxtmeuuyfkpjo.supabase.co',
    // PENDIENTE: Colocar aquí la clave anónima (anon_key) de Supabase para activar la subida directa a Storage
    anonKey: '',
    buckets: {
      sedes: 'sedes',
      evidencias: 'evidencias-entregas',
      productos: 'productos',
      mantenimiento: 'mantenimiento'
    }
  }
};
