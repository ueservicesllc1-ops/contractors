# Configuración de Firebase para ContractorApp

## 🔥 Pasos para Configurar Firebase

### 1. Configurar Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `contractor-93f20`
3. Ve a **Authentication** > **Sign-in method**
4. Habilita los siguientes proveedores:

#### Email/Password
- ✅ Habilitar
- ✅ Email link (passwordless sign-in) - Opcional

#### Google
- ✅ Habilitar
- **Nombre del proyecto**: ContractorApp
- **Email de soporte**: tu-email@dominio.com
- **Dominios autorizados**: 
  - `localhost` (para desarrollo)
  - Tu dominio de producción

### 2. Configurar Firestore Database

1. Ve a **Firestore Database**
2. Crea una base de datos en modo de producción
3. Selecciona una ubicación (recomendado: us-central1)

#### Configurar Reglas de Seguridad

1. Ve a **Firestore Database** > **Rules**
2. Reemplaza las reglas existentes con el contenido del archivo `firestore.rules`
3. Haz clic en **Publicar**

### 3. Estructura de Colecciones

Las siguientes colecciones se crearán automáticamente:

```
📁 users/
  📄 {userId}
    - id: string
    - email: string
    - name: string
    - role: string
    - company?: string
    - phone?: string
    - createdAt: timestamp
    - updatedAt: timestamp

📁 clients/
  📄 {clientId}
    - name: string
    - email: string
    - phone: string
    - address: string
    - city: string
    - state: string
    - zipCode: string
    - notes?: string
    - createdAt: timestamp
    - updatedAt: timestamp

📁 projects/
  📄 {projectId}
    - projectNumber: string
    - name: string
    - clientId: string
    - address: string
    - city: string
    - state: string
    - zipCode: string
    - description?: string
    - status: string
    - startDate: timestamp
    - endDate?: timestamp
    - estimatedCost: number
    - actualCost: number
    - phases: array
    - teamMembers: array
    - files: array
    - createdAt: timestamp
    - updatedAt: timestamp

📁 estimates/
  📄 {estimateId}
    - projectId: string
    - estimateNumber: string
    - name: string
    - description?: string
    - status: string
    - items: array
    - subtotal: number
    - tax: number
    - total: number
    - validUntil: timestamp
    - createdAt: timestamp
    - updatedAt: timestamp

📁 invoices/
  📄 {invoiceId}
    - projectId: string
    - invoiceNumber: string
    - clientId: string
    - status: string
    - items: array
    - subtotal: number
    - tax: number
    - total: number
    - amountPaid: number
    - balance: number
    - issueDate: timestamp
    - dueDate: timestamp
    - paidDate?: timestamp
    - notes?: string
    - createdAt: timestamp
    - updatedAt: timestamp

📁 purchases/
  📄 {purchaseId}
    - projectId?: string
    - vendor: string
    - description: string
    - amount: number
    - billable: boolean
    - status: string
    - invoiceNumber?: string
    - purchaseDate: timestamp
    - dueDate?: timestamp
    - paidDate?: timestamp
    - files: array
    - createdAt: timestamp
    - updatedAt: timestamp

📁 changeOrders/
  📄 {changeOrderId}
    - projectId: string
    - changeOrderNumber: string
    - description: string
    - reason: string
    - estimatedCost: number
    - approvedCost?: number
    - status: string
    - requestedBy: string
    - approvedBy?: string
    - requestedDate: timestamp
    - approvedDate?: timestamp
    - items: array
    - createdAt: timestamp
    - updatedAt: timestamp
```

### 4. Configurar Storage (Opcional)

Si quieres usar Firebase Storage además de Backblaze B2:

1. Ve a **Storage**
2. Crear bucket
3. Configurar reglas de seguridad:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAdwXUNViQIS0jCa1IwZfehPZD0az7cZJs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=contractor-93f20.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=contractor-93f20
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=contractor-93f20.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=695480164637
NEXT_PUBLIC_FIREBASE_APP_ID=1:695480164637:web:7046aefdfb6485a90fc1f4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-057KYSQE5K
```

### 6. Probar la Configuración

1. Inicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000`
3. Intenta registrarte con email/contraseña
4. Intenta iniciar sesión con Google
5. Verifica que los datos se guarden en Firestore

### 7. Monitoreo y Logs

- Ve a **Authentication** > **Users** para ver usuarios registrados
- Ve a **Firestore Database** > **Data** para ver los datos
- Ve a **Functions** > **Logs** para ver logs de la aplicación

## 🔒 Reglas de Seguridad Explicadas

### Usuarios
- Solo pueden acceder a sus propios datos
- Validación de estructura de datos al crear

### Clientes, Proyectos, etc.
- Solo usuarios autenticados pueden acceder
- Validaciones de tipo de datos
- Estados permitidos definidos

### Seguridad General
- Acceso denegado por defecto
- Solo rutas específicas permitidas
- Validaciones de estructura de datos

## 🚨 Solución de Problemas

### Error: "Missing or insufficient permissions"
- Verifica que las reglas estén publicadas
- Asegúrate de que el usuario esté autenticado
- Revisa que los datos tengan la estructura correcta

### Error: "Firebase: Error (auth/popup-closed-by-user)"
- El usuario cerró la ventana de Google Sign-In
- Es normal, no es un error crítico

### Error: "Firebase: Error (auth/email-already-in-use)"
- El email ya está registrado
- Usa "Iniciar sesión" en lugar de "Registrarse"

## ✅ Lista de Verificación

- [ ] Authentication habilitado (Email/Password + Google)
- [ ] Firestore Database creado
- [ ] Reglas de seguridad configuradas
- [ ] Variables de entorno configuradas
- [ ] Dominios autorizados configurados
- [ ] Aplicación probada localmente
- [ ] Usuarios pueden registrarse
- [ ] Google Sign-In funciona
- [ ] Datos se guardan en Firestore
