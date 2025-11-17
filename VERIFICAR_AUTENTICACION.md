# 🔍 Verificar Autenticación y Permisos

## Pasos para Diagnosticar el Problema:

### 1. Verificar que Estás Autenticado

1. Abre la aplicación en tu navegador
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **"Console"**
4. Escribe esto y presiona Enter:

```javascript
firebase.auth().currentUser
```

**Resultado esperado:**
- Si ves un objeto con `uid`, `email`, etc. → ✅ Estás autenticado
- Si ves `null` → ❌ No estás autenticado (necesitas iniciar sesión)

### 2. Verificar las Reglas en Firebase

1. Ve a: https://console.firebase.google.com/
2. Selecciona: **gastos-a9062**
3. Ve a: **Firestore Database** → Pestaña **"Reglas"**
4. **Verifica** que las reglas estén así (o más permisivas):

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

5. Si no están así, **cópialas y pégalas**
6. Haz clic en **"Publicar"**
7. Espera 30 segundos

### 3. Verificar en la Consola del Navegador

Cuando intentas agregar una quincena, deberías ver en la consola:

```
Usuario actual: [objeto con tu información]
User UID: [tu-uid-aqui]
Intentando crear quincena con datos: {...}
```

Si ves errores aquí, compártelos.

### 4. Reglas MÁS SIMPLES (Prueba esto)

Si nada funciona, prueba estas reglas ULTRA SIMPLES (solo para desarrollo):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ADVERTENCIA**: Estas reglas permiten TODO a TODOS. Solo para probar.

Si esto funciona, entonces el problema es con la autenticación. Si no funciona, el problema es con Firestore mismo.

### 5. Verificar que Firestore Está Habilitado

1. Ve a Firebase Console
2. Ve a **Firestore Database**
3. Deberías ver la base de datos creada
4. Si no existe, haz clic en **"Crear base de datos"**
   - Selecciona **"Iniciar en modo de prueba"**
   - Selecciona una ubicación
   - Espera a que se cree

### 6. Cerrar Sesión y Volver a Iniciar

A veces el token de autenticación expira:

1. En la app, haz clic en **"Salir"**
2. Cierra completamente el navegador
3. Abre el navegador de nuevo
4. Ve a la app
5. Inicia sesión nuevamente
6. Intenta agregar una quincena

## 📋 Información que Necesito:

Si sigue sin funcionar, comparte:

1. ¿Qué ves cuando escribes `firebase.auth().currentUser` en la consola?
2. ¿Qué reglas tienes actualmente en Firebase? (copia y pega)
3. ¿Qué errores ves en la consola cuando intentas agregar una quincena?
4. ¿Está creada la base de datos Firestore?

