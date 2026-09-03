# Intranet Distribución - Frontend Web

Cliente web desarrollado en Angular 21 con TypeScript para la gestión de logística, pedidos, almacenes, flota y seguimiento en tiempo real de la intranet de distribución.

---

## Arquitectura del Proyecto

El proyecto utiliza una arquitectura modular basada en componentes de Angular (Standalone Components) estructurada por módulos de negocio:

```text
src/app/
│
├── core/             # Servicios globales, guardias de navegación e interceptores HTTP
│   ├── guards/
│   ├── interceptors/
│   └── services/
│
├── shared/           # Componentes reutilizables, pipes y directivas
│   ├── components/
│   └── pipes/
│
├── layout/           # Contenedores de diseño (Sidebar, Header, Main/Auth Layouts)
│   ├── components/
│   ├── main-layout/
│   └── auth-layout/
│
├── features/         # Módulos y vistas principales por requerimiento funcional
│   ├── auth/         # Login y autenticación
│   ├── usuarios/     # Gestión de usuarios, roles y sedes
│   ├── inventario/   # Productos, categorías y control de stock
│   ├── pedidos/      # Clientes, generación y aprobación de pedidos
│   ├── rutas/        # Zonas de reparto, rutas y seguimiento de entregas
│   ├── flota/        # Vehículos, conductores y mantenimiento
│   └── reportes/     # Dashboards y reportes analíticos
│
└── assets/           # Imágenes, estilos globales y recursos estáticos
```

---

## Requisitos Previos

- Node.js: 20+ o 22+ LTS
- Gestor de paquetes: npm

---

## Configuración del Entorno

Asegurarse de tener configurada la URL base de la API REST de Spring Boot en los archivos de entorno (`src/environments/environment.ts`):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
};
```

---

## Comandos de Desarrollo

```bash
# Instalación de dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:4200)
npm start

# Compilar para producción
npm run build

# Ejecutar pruebas unitarias
npm test
```

---

## Mapa de Módulos y Requerimientos Funcionales

A continuación se detallan los módulos de interfaz gráfica mapeados con el backend de la aplicación:

### 1. Seguridad y Acceso

- RF-01: Interfaz de inicio de sesión (Usuario y Contraseña)
- RF-02: Gestión de vistas según roles y permisos (RBAC)

### 2. Administración Base

- RF-03: Módulo de gestión de usuarios
- RF-04: Módulo de gestión de sedes
- RF-05: Módulo de gestión de almacenes

### 3. Catálogo e Inventario

- RF-06: Módulo de gestión de productos
- RF-07: Módulo de gestión de categorías
- RF-08: Módulo de control de stock e inventario

### 4. Pedidos y Clientes

- RF-09: Módulo de gestión de clientes
- RF-10: Módulo de generación de pedidos
- RF-11: Módulo de aprobación de pedidos
- RF-12: Módulo de facturación y guías de remisión

### 5. Rutas y Logística de Distribución

- RF-13: Módulo de zonas de reparto
- RF-14: Módulo de rutas de distribución
- RF-15: Módulo de asignación de pedidos a rutas
- RF-16: Módulo de seguimiento de entregas
- RF-17: Módulo de incidencias de entrega

### 6. Flota y Conductores

- RF-18: Módulo de gestión de vehículos
- RF-19: Módulo de gestión de conductores
- RF-20: Módulo de mantenimiento de flota
- RF-21: Módulo de asignación vehículo-conductor-ruta

### 7. Reportes y Analítica

- RF-22: Reporte de inventario (PDF/Excel)
- RF-23: Reporte de pedidos
- RF-24: Reporte de entregas y cumplimiento
- RF-25: Reporte de productividad de flota
- RF-26: Dashboard general de KPIs logísticos

---

## Licencia y Autoría

Desarrollado por el equipo de **Desarrollo Web Integrado - UTP**.

- Navarro Domínguez, Rommel Eduardo
- Pujay Narciso, Alinder Steeven
- Alvarado Chávez, Romina Liz
- Herrera Gutierreez, Mathias Sebastian
