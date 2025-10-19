# Sistema de Configuración Inicial de Perfil

## 🎯 Propósito

El sistema de configuración inicial garantiza que todos los usuarios tengan un perfil completo antes de acceder al dashboard principal. Esto es obligatorio y no se puede omitir.

## 🔄 Flujo de Usuario

### 1. Registro/Login
- Usuario se registra o inicia sesión
- Sistema verifica si existe un perfil completo

### 2. Verificación de Perfil
- Si NO tiene perfil completo → Redirige a `/setup`
- Si SÍ tiene perfil completo → Redirige a `/dashboard`

### 3. Configuración Inicial (Solo una vez)
- Usuario completa formulario de configuración
- Datos se guardan en Firestore
- Usuario es redirigido al dashboard
- **Nunca más se le pedirá completar el perfil**

## 📋 Información Requerida

### Tipo de Negocio
- **Empresa**: Para empresas registradas con empleados
- **Contratista Independiente**: Para trabajadores independientes

### Información de Empresa (Solo si es empresa)
- Nombre de la empresa
- Tipo de empresa (LLC, Corporation, etc.)
- Licencia de negocio
- EIN (Tax ID)

### Información de Contacto (Siempre requerida)
- Nombre completo
- Email
- Teléfono

### Dirección (Siempre requerida)
- Dirección completa
- Ciudad
- Estado (default: New Jersey)
- Código postal
- País (default: United States)

### Información del Negocio
- Años en el negocio
- Tamaño del equipo (solo empresas)
- Especialidades (múltiples selección)

### Licencia de Contratista - New Jersey
- Número de licencia
- Tipo de licencia
- Fecha de vencimiento

### Seguro de Responsabilidad Civil
- Compañía de seguros
- Número de póliza
- Monto de cobertura
- Fecha de vencimiento

## 🔒 Seguridad y Validación

### Reglas de Firestore
```javascript
match /profiles/{profileId} {
  // Solo el usuario propietario puede leer/escribir su perfil
  allow read, write: if request.auth != null && request.auth.uid == profileId;
}
```

### Validación de Datos
- Todos los campos requeridos deben completarse
- Validación de email y teléfono
- Verificación de tipos de datos
- Validación condicional según tipo de negocio

## 🛡️ ProfileGuard Component

El componente `ProfileGuard` protege las rutas y verifica:

1. **Usuario autenticado**: Si no está logueado → `/login`
2. **Perfil completo**: Si no tiene perfil → `/setup`
3. **Acceso autorizado**: Si todo está OK → Permite acceso

### Uso en Páginas
```tsx
<ProtectedRoute>
  <ProfileGuard>
    <AppLayout>
      {/* Contenido de la página */}
    </AppLayout>
  </ProfileGuard>
</ProtectedRoute>
```

## 📊 Estructura de Datos

### CompanyProfile Interface
```typescript
interface CompanyProfile {
  id: string;
  userId: string;
  type: 'company' | 'independent_contractor';
  
  // Información de empresa
  companyName?: string;
  companyType?: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship';
  businessLicense?: string;
  ein?: string;
  
  // Información de contacto
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Dirección
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Información del negocio
  specialties?: string[];
  yearsInBusiness?: number;
  teamSize?: number;
  
  // Seguro
  liabilityInsurance?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: Date;
  };
  
  // New Jersey específico
  njContractorLicense?: string;
  njLicenseType?: string;
  njLicenseExpiry?: Date;
  
  // Estado del perfil
  isProfileComplete: boolean;
  profileCompletionDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎨 Interfaz de Usuario

### Características del Formulario
- **Diseño por secciones**: Información organizada en grupos lógicos
- **Validación en tiempo real**: Errores mostrados inmediatamente
- **Campos condicionales**: Campos que aparecen según el tipo de negocio
- **Selección múltiple**: Para especialidades del negocio
- **Diseño responsivo**: Funciona en móviles y desktop

### Estados del Formulario
- **Cargando**: Mientras se guarda la información
- **Error**: Si hay problemas al guardar
- **Éxito**: Redirección automática al dashboard

## 🔄 Contexto de Perfil

### ProfileContext
- Maneja el estado del perfil del usuario
- Proporciona funciones para actualizar y refrescar
- Se integra con AuthContext para obtener el usuario actual

### Hooks Disponibles
```typescript
const {
  profile,           // Datos del perfil actual
  loading,          // Estado de carga
  isProfileComplete, // Si el perfil está completo
  updateProfile,    // Función para actualizar
  refreshProfile    // Función para refrescar
} = useProfile();
```

## 📱 Experiencia Móvil

### Optimizaciones
- Formulario adaptado para pantallas pequeñas
- Campos organizados en columnas responsivas
- Botones de tamaño adecuado para táctil
- Navegación intuitiva entre secciones

## 🚀 Próximas Mejoras

### Funcionalidades Futuras
- **Edición de perfil**: Permitir modificar información después
- **Validación de licencias**: Verificar automáticamente con bases de datos estatales
- **Integración con seguros**: Verificar pólizas de seguros
- **Plantillas de perfil**: Para diferentes tipos de contratistas
- **Importación de datos**: Desde sistemas existentes

### Mejoras de UX
- **Guardado automático**: Guardar progreso mientras se completa
- **Validación avanzada**: Verificar información con APIs externas
- **Onboarding interactivo**: Guía paso a paso para nuevos usuarios
- **Perfiles de empresa**: Configuración para múltiples usuarios de la misma empresa

## 📋 Lista de Verificación

### Para Desarrolladores
- [ ] ProfileContext implementado
- [ ] ProfileGuard funcionando
- [ ] Formulario de configuración completo
- [ ] Validaciones implementadas
- [ ] Reglas de Firestore configuradas
- [ ] Redirecciones funcionando
- [ ] Diseño responsivo
- [ ] Manejo de errores

### Para Usuarios
- [ ] Registro/login funcionando
- [ ] Redirección automática a setup
- [ ] Formulario fácil de completar
- [ ] Validaciones claras
- [ ] Guardado exitoso
- [ ] Acceso al dashboard después de completar

## 🔧 Solución de Problemas

### Problemas Comunes

1. **Usuario no puede acceder al dashboard**
   - Verificar que el perfil esté marcado como completo
   - Revisar las reglas de Firestore
   - Verificar la configuración del ProfileGuard

2. **Formulario no se guarda**
   - Verificar conexión a Firebase
   - Revisar validaciones del formulario
   - Verificar permisos de Firestore

3. **Redirección incorrecta**
   - Verificar la lógica del ProfileGuard
   - Revisar el estado del perfil en el contexto
   - Verificar las condiciones de redirección

### Logs Útiles
```javascript
// En el navegador
console.log('Profile:', profile);
console.log('Is Complete:', isProfileComplete);
console.log('User:', user);
```
