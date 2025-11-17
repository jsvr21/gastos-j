# 🔧 Solución: ERR_BLOCKED_BY_CLIENT

## ⚠️ Problema Detectado

El error `ERR_BLOCKED_BY_CLIENT` significa que una **extensión del navegador** está bloqueando las peticiones a Firebase.

## ✅ Soluciones:

### 1. Desactivar Bloqueadores de Anuncios

**Extensiones comunes que bloquean Firebase:**
- uBlock Origin
- AdBlock
- AdBlock Plus
- Privacy Badger
- Ghostery

**Pasos:**
1. Haz clic en el icono de la extensión en tu navegador
2. Desactívala temporalmente
3. Recarga la página (F5)
4. Intenta agregar una quincena nuevamente

### 2. Permitir Firebase en el Bloqueador

Si no quieres desactivar la extensión:

**Para uBlock Origin:**
1. Haz clic en el icono de uBlock
2. Haz clic en el icono de "power" para desactivar en este sitio
3. O agrega `firestore.googleapis.com` a la lista blanca

**Para AdBlock:**
1. Haz clic en el icono de AdBlock
2. Selecciona "Pausar en este sitio"
3. O agrega excepciones para:
   - `firestore.googleapis.com`
   - `firebase.googleapis.com`
   - `googleapis.com`

### 3. Usar Modo Incógnito

1. Abre una ventana de incógnito (Ctrl+Shift+N)
2. Ve a tu aplicación
3. Inicia sesión
4. Intenta agregar una quincena

Si funciona en incógnito, confirma que es un bloqueador.

### 4. Verificar las Reglas de Firestore

Asegúrate de que las reglas estén así (temporalmente permisivas):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Verificar Autenticación

En la consola del navegador (F12), escribe:

```javascript
firebase.auth().currentUser
```

Deberías ver un objeto con tu información. Si ves `null`, no estás autenticado.

## 🔍 Verificar que Funcionó

Después de desactivar el bloqueador:

1. Recarga la página (F5)
2. Intenta agregar una quincena
3. Deberías ver en la consola:
   - "Usuario actual: [objeto]"
   - "Quincena creada exitosamente"

## ⚠️ Si Sigue Sin Funcionar

1. Verifica que las reglas estén publicadas en Firebase
2. Verifica que estés autenticado
3. Prueba en otro navegador (Chrome, Firefox, Edge)
4. Prueba en modo incógnito

