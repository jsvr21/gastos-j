# 🔥 Reglas de Firestore - VERSIÓN FINAL

## ⚠️ IMPORTANTE: Copia estas reglas EXACTAMENTE

El error de permisos se soluciona aplicando estas reglas. **Copia y pega TODO el código de abajo.**

## 📋 Pasos:

1. Ve a: https://console.firebase.google.com/
2. Selecciona: **gastos-a9062**
3. Ve a: **Firestore Database** → Pestaña **"Reglas"**
4. **BORRA TODO** el contenido actual
5. **COPIA Y PEGA** el código completo de abajo
6. Haz clic en **"Publicar"**
7. Espera 30 segundos
8. Recarga tu aplicación (F5)

## 📝 Código de las Reglas (COPIA TODO):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para quincenas
    match /fortnights/{fortnightId} {
      // Permitir leer si el usuario está autenticado
      allow read: if request.auth != null;
      
      // Permitir crear si el usuario está autenticado y el userId coincide
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      
      // Permitir actualizar/eliminar si el usuario está autenticado y es el dueño
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Reglas para gastos
    match /expenses/{expenseId} {
      // Permitir leer si el usuario está autenticado
      allow read: if request.auth != null;
      
      // Permitir crear si el usuario está autenticado y el userId coincide
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      
      // Permitir actualizar/eliminar si el usuario está autenticado y es el dueño
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Reglas para usuarios
    match /users/{userId} {
      // Permitir leer y escribir solo si el userId coincide con el usuario autenticado
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ✅ ¿Qué hacen estas reglas?

- ✅ **Quincenas**: Cualquier usuario autenticado puede leer, pero solo puede crear/editar las suyas
- ✅ **Gastos**: Cualquier usuario autenticado puede leer, pero solo puede crear/editar los suyos
- ✅ **Usuarios**: Solo puedes leer/escribir tu propio documento de usuario
- ✅ **Seguridad**: Solo usuarios autenticados pueden acceder

## 🔍 Verificar que funcionó:

1. Después de publicar, espera 30 segundos
2. Recarga la aplicación
3. Intenta agregar una quincena
4. Si funciona, ¡listo! Si no, verifica que copiaste TODO el código

## ⚠️ Si sigue sin funcionar:

1. Verifica que estés autenticado (deberías ver tu nombre en la app)
2. Verifica que Email/Password esté habilitado en Authentication
3. Verifica que copiaste TODO el código sin modificar nada
4. Intenta cerrar sesión y volver a iniciar sesión


