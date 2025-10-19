# Configuración de Backblaze B2

## Información del Bucket

- **Nombre del Bucket**: `contractors`
- **Tipo**: Público
- **Bucket ID**: `5c62fbd582c6fb7e909b0a1a`
- **Endpoint**: `s3.us-east-005.backblazeb2.com`
- **Fecha de Creación**: October 18, 2025

## Credenciales de Acceso

- **Key ID**: `005c2b526be0baa000000001b`
- **Key Name**: `contractorskey`
- **Application Key**: `K005yNAO1B3iTmVzCbpNHg4mvChvDX4`

## Configuración CORS

Para que las subidas de archivos funcionen correctamente desde el navegador, el bucket debe tener configurado CORS. Aquí está la configuración recomendada:

```json
[
  {
    "corsRuleName": "allow-all-origins",
    "allowedOrigins": ["*"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["b2_upload_file", "b2_download_file_by_id", "b2_download_file_by_name"],
    "exposeHeaders": ["x-bz-content-sha1", "x-bz-file-id", "x-bz-file-name"],
    "maxAgeSeconds": 3600
  }
]
```

## URLs de Acceso

- **URL Pública**: `https://f000.backblazeb2.com/file/contractors/`
- **Endpoint S3**: `https://s3.us-east-005.backblazeb2.com`

## Uso en la Aplicación

La aplicación utiliza un sistema de signed URLs para subir archivos de forma segura:

1. **Cliente solicita signed URL**: El frontend solicita una URL firmada al backend
2. **Backend genera signed URL**: Usando AWS SDK configurado para Backblaze B2
3. **Cliente sube archivo**: Directamente a Backblaze B2 usando la URL firmada
4. **Archivo disponible**: Inmediatamente disponible a través de URL pública

## Estructura de Archivos

Los archivos se organizan en carpetas dentro del bucket:

- `uploads/` - Archivos generales
- `projects/` - Archivos de proyectos específicos
- `clients/` - Documentos de clientes
- `invoices/` - Facturas y documentos de facturación

## Límites y Restricciones

- **Tamaño máximo por archivo**: 10MB (configurable)
- **Tipos de archivo permitidos**: Imágenes, PDFs, documentos de Office
- **Tiempo de vida de signed URL**: 1 hora
- **Máximo de archivos por proyecto**: Sin límite

## Seguridad

- Las credenciales están hardcodeadas en el código (para desarrollo)
- En producción, usar variables de entorno
- Las signed URLs tienen tiempo de expiración
- El bucket es público pero las URLs son únicas

## Monitoreo

Puedes monitorear el uso del bucket desde:
- [Backblaze B2 Console](https://secure.backblaze.com/user_b2.htm)
- Bucket: `contractors`
- Métricas: Archivos subidos, tamaño usado, transferencias

## Backup y Recuperación

- Los archivos se almacenan con redundancia automática
- Versionado habilitado para recuperación de versiones anteriores
- No se requieren backups manuales
