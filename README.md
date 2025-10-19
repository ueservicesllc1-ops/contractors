# ContractorApp - Sistema de Gestión para Contratistas

Una aplicación web profesional para la gestión integral de proyectos de construcción, desarrollada con Next.js, TypeScript y Firebase.

## 🚀 Características Principales

### ✅ Implementadas
- **Sistema de Autenticación**: Login y registro con Firebase Auth + Google Sign-In
- **Configuración Inicial Obligatoria**: Perfil completo antes de acceder al dashboard
- **Dashboard Interactivo**: Estadísticas y resumen de proyectos
- **Gestión de Proyectos**: CRUD completo con fases y responsables
- **Gestión de Clientes**: Base de datos de clientes con información completa
- **Sistema de Estimados**: Completo con estándares de New Jersey
- **Sistema de Archivos**: Subida y gestión de archivos con Backblaze B2
- **Diseño Responsivo**: Optimizado para móviles y desktop
- **Interfaz Moderna**: UI/UX profesional con Tailwind CSS
- **APIs de Backend**: Sistema de signed URLs para subida de archivos
- **Autenticación Social**: Inicio de sesión con Google integrado

### 🔄 En Desarrollo
- **Estimados y Presupuestos**: Sistema de cálculos automáticos
- **Facturación**: Generación de facturas y control de pagos
- **Gestión de Compras**: Registro de gastos y proveedores
- **Órdenes de Cambio**: Control de modificaciones del proyecto
- **Reportes y Analytics**: Análisis de rentabilidad y rendimiento
- **Integración con Backblaze B2**: Almacenamiento de archivos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Almacenamiento**: Backblaze B2 (configurado)
- **Formularios**: React Hook Form, Zod
- **Notificaciones**: React Hot Toast
- **Iconos**: Heroicons

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd contractor-app
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp env.example .env.local
   ```
   
   **Backblaze B2 ya está configurado** con las siguientes credenciales:
   - Bucket: `contractors`
   - Key ID: `005c2b526be0baa000000001b`
   - Application Key: `K005yNAO1B3iTmVzCbpNHg4mvChvDX4`
   - Endpoint: `s3.us-east-005.backblazeb2.com`
   
   Solo necesitas configurar Firebase en `.env.local`.

4. **Ejecuta la aplicación**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuración

### Firebase Setup

1. **Configura Authentication:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto `contractor-93f20`
   - Ve a Authentication > Sign-in method
   - Habilita **Email/Password** y **Google**
   - Para Google: configura nombre del proyecto y email de soporte

2. **Configura Firestore Database:**
   - Crea una base de datos en modo de producción
   - Ve a Rules y reemplaza con el contenido de `firestore.rules`
   - Publica las reglas

3. **Configura variables de entorno:**
   - Las credenciales ya están configuradas en el código
   - Solo necesitas crear `.env.local` si quieres personalizar

**📋 Archivos de configuración incluidos:**
- `firestore.rules` - Reglas de seguridad
- `FIREBASE_SETUP.md` - Guía completa de configuración
- `deploy-firebase.bat` - Script para desplegar reglas (Windows)

### Backblaze B2 Setup (Ya Configurado)

✅ **Backblaze B2 ya está configurado y listo para usar:**
- Bucket: `contractors` (Público)
- CORS configurado para permitir subidas desde el navegador
- Sistema de signed URLs implementado
- Soporte para imágenes, PDFs y documentos

**Características del sistema de archivos:**
- Subida directa desde el navegador usando signed URLs
- Almacenamiento seguro en Backblaze B2
- URLs públicas para acceso a archivos
- Soporte para múltiples tipos de archivo
- Eliminación de archivos desde la interfaz

## 🎯 Uso de la Aplicación

### Primeros Pasos

1. **Regístrate**: Crea una cuenta con email/contraseña o usa Google Sign-In
2. **Configuración Inicial**: Completa el perfil de tu empresa (obligatorio)
3. **Dashboard**: Explora las estadísticas y proyectos recientes
4. **Clientes**: Agrega tus primeros clientes
5. **Proyectos**: Crea un nuevo proyecto de construcción
6. **Estimados**: Genera presupuestos profesionales
7. **Navegación**: Usa el menú lateral para acceder a todas las funciones

### Opciones de Autenticación

- **Email y Contraseña**: Registro tradicional con validación
- **Google Sign-In**: Inicio de sesión rápido con tu cuenta de Google
- **Gestión Automática**: Los datos se sincronizan automáticamente

### Gestión de Proyectos

- **Crear Proyecto**: Define nombre, cliente, dirección y fechas
- **Fases**: Organiza el proyecto en fases con costos estimados
- **Seguimiento**: Monitorea el progreso y gastos reales
- **Archivos**: Sube fotos y documentos del proyecto

### Gestión de Clientes

- **Información Completa**: Nombre, contacto, dirección
- **Historial**: Ve todos los proyectos del cliente
- **Notas**: Mantén información adicional sobre cada cliente

## 📱 Características Móviles

- **Diseño Responsivo**: Funciona perfectamente en móviles
- **Navegación Táctil**: Optimizada para dispositivos táctiles
- **Acceso Rápido**: Botones de acción rápida para operaciones comunes
- **Formularios Adaptados**: Campos optimizados para pantallas pequeñas

## 🔧 Desarrollo

### Estructura del Proyecto

```
src/
├── app/                 # Páginas de Next.js
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación
│   ├── dashboard/      # Componentes del dashboard
│   ├── layout/         # Layout y navegación
│   └── projects/       # Componentes de proyectos
├── contexts/           # Contextos de React
├── lib/               # Utilidades y configuración
└── types/             # Definiciones de TypeScript
```

### Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construcción para producción
npm run start        # Servidor de producción
npm run lint         # Linting
```

## 🚀 Próximas Características

- [ ] Sistema completo de estimados con cálculos automáticos
- [ ] Generación de facturas PDF
- [ ] Integración con sistemas de pago (Stripe)
- [ ] Aplicación móvil nativa
- [ ] Integración con QuickBooks
- [ ] Sistema de notificaciones push
- [ ] Reportes avanzados con gráficos
- [ ] API REST para integraciones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de Firebase y Next.js

---

**ContractorApp** - Transformando la gestión de proyectos de construcción 🏗️