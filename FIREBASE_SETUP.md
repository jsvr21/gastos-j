# Configuración de Firebase

## Pasos para configurar Firebase correctamente

### 1. Configurar Firestore Database

1. Ve a la consola de Firebase: https://console.firebase.google.com/
2. Selecciona tu proyecto: `gastos-a9062`
3. Ve a **Firestore Database** en el menú lateral
4. Crea la base de datos si no existe
5. Selecciona modo de producción o modo de prueba (para desarrollo)

### 2. Configurar Reglas de Seguridad ⚠️ CRÍTICO

**⚠️ ESTE PASO ES OBLIGATORIO. Sin estas reglas, la aplicación NO funcionará.**

1. En Firestore Database, ve a la pestaña **Reglas**
2. **BORRA** todo el contenido actual
3. Copia y pega el contenido del archivo `firestore.rules` que está en la raíz del proyecto
4. Haz clic en **"Publicar"** para aplicar las reglas

**📋 Instrucciones detalladas:** Consulta el archivo `FIRESTORE_RULES_SETUP.md` para pasos más detallados.

Las reglas aseguran que:
- Solo usuarios autenticados pueden leer/escribir datos
- Los usuarios solo pueden acceder a sus propios datos (quincenas y gastos)
- Permite consultas incluso cuando no hay documentos aún

### 3. Configurar Authentication

1. Ve a **Authentication** en el menú lateral
2. Habilita el método de autenticación **Email/Password**
3. El usuario inicial se creará automáticamente la primera vez que inicies sesión con:
   - Usuario: `jormanstiv`
   - Contraseña: `12345jorman`

### 4. Índices Compuestos (si es necesario)

Si ves errores sobre índices faltantes al hacer consultas, Firebase te mostrará un enlace para crearlos automáticamente. Solo haz clic en el enlace y se crearán.

Los índices necesarios son:
- `fortnights`: userId (Ascending), year (Descending), month (Descending)
- `fortnights`: userId (Ascending), year (Ascending), month (Ascending), day (Ascending)
- `expenses`: userId (Ascending), fortnightId (Ascending), createdAt (Descending)

### 5. Verificar la Configuración

Una vez configurado todo:
1. Ejecuta la aplicación: `npm start`
2. Inicia sesión con el usuario inicial
3. Verifica que puedas crear quincenas y gastos
4. Los datos deberían guardarse en Firestore

## Estructura de Datos en Firestore

### Colección: `fortnights`
```
{
  userId: string,
  year: number,
  month: number,
  day: number (15 o 30),
  total: number,
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### Colección: `expenses`
```
{
  userId: string,
  fortnightId: string,
  name: string,
  amount: number,
  description: string,
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

## Notas Importantes

- Todos los montos se guardan en pesos colombianos (COP)
- Los datos se sincronizan automáticamente con Firebase
- Cada usuario solo puede ver y modificar sus propios datos
- La aplicación funciona offline y sincroniza cuando hay conexión

