# 🔥 Configuración de Reglas de Firestore - PASO CRÍTICO

## ⚠️ IMPORTANTE: Este paso es OBLIGATORIO

El error "Missing or insufficient permissions" significa que **las reglas de Firestore no están configuradas**. Sin estas reglas, la aplicación NO funcionará.

## 📋 Pasos para Configurar las Reglas:

### 1. Ve a la Consola de Firebase
- Abre: https://console.firebase.google.com/
- Selecciona tu proyecto: **gastos-a9062**

### 2. Ve a Firestore Database
- En el menú lateral izquierdo, haz clic en **"Firestore Database"**
- Si no has creado la base de datos, haz clic en **"Crear base de datos"**
  - Selecciona **"Iniciar en modo de prueba"** (para desarrollo)
  - O **"Iniciar en modo de producción"** (si prefieres)
  - Selecciona una ubicación (puede ser `us-central` o la más cercana)

### 3. Configura las Reglas de Seguridad
1. En la pestaña **"Reglas"** (arriba, junto a "Datos")
2. **BORRA** todo el contenido que esté ahí
3. **COPIA Y PEGA** exactamente este código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para quincenas
    match /fortnights/{fortnightId} {
      // Permitir leer si el usuario está autenticado y es el dueño del documento
      allow read: if request.auth != null && 
                     (resource == null || request.auth.uid == resource.data.userId);
      
      // Permitir crear si el usuario está autenticado y el userId coincide
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      
      // Permitir actualizar/eliminar si el usuario está autenticado y es el dueño
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Reglas para gastos
    match /expenses/{expenseId} {
      // Permitir leer si el usuario está autenticado y es el dueño del documento
      allow read: if request.auth != null && 
                     (resource == null || request.auth.uid == resource.data.userId);
      
      // Permitir crear si el usuario está autenticado y el userId coincide
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      
      // Permitir actualizar/eliminar si el usuario está autenticado y es el dueño
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
  }
}
```

4. Haz clic en **"Publicar"** (botón azul arriba a la derecha)

### 4. Verifica que las Reglas se Aplicaron
- Deberías ver un mensaje de éxito
- Las reglas deberían aparecer en la pestaña "Reglas"

### 5. Recarga la Aplicación
- Vuelve a tu aplicación web
- Recarga la página (F5)
- Intenta iniciar sesión nuevamente
- El error debería desaparecer

## 🔍 ¿Qué hacen estas reglas?

- ✅ Solo usuarios autenticados pueden leer/escribir datos
- ✅ Cada usuario solo puede ver y modificar sus propios datos
- ✅ Permite consultas incluso cuando no hay documentos aún
- ✅ Protege los datos de otros usuarios

## ⚠️ Reglas Temporales para Desarrollo (NO RECOMENDADO para producción)

Si quieres reglas más permisivas solo para probar (NO SEGURO para producción):

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

**⚠️ ADVERTENCIA:** Estas reglas permiten que cualquier usuario autenticado vea y modifique todos los datos. Solo úsalas para desarrollo.

## 🐛 Solución de Problemas

- **Error persiste después de aplicar reglas:** Espera 1-2 minutos y recarga
- **No puedo publicar las reglas:** Verifica que copiaste todo el código correctamente
- **Sigue sin funcionar:** Verifica que estás autenticado (deberías ver tu usuario en la app)

