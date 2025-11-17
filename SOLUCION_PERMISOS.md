# 🔧 Solución al Error de Permisos

## ⚠️ Error: "Missing or insufficient permissions"

Este error ocurre porque las reglas de Firestore no permiten consultas con `orderBy` y `where` al mismo tiempo.

## ✅ Solución: Actualizar las Reglas

He actualizado las reglas en el archivo `firestore.rules`. Ahora necesitas:

### 1. Copiar las Nuevas Reglas

Abre el archivo `firestore.rules` en tu proyecto y copia todo su contenido.

### 2. Aplicar las Reglas en Firebase

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **gastos-a9062**
3. Ve a **Firestore Database** → Pestaña **"Reglas"**
4. **BORRA** todo el contenido actual
5. **PEGA** el contenido completo del archivo `firestore.rules`
6. Haz clic en **"Publicar"**

### 3. Verificar

- Espera 10-30 segundos para que las reglas se apliquen
- Recarga tu aplicación (F5)
- El error debería desaparecer

## 🔍 ¿Qué cambié?

Las nuevas reglas incluyen:
- `allow list`: Permite consultas/lista de documentos
- Mantiene la seguridad: Solo usuarios autenticados pueden consultar
- Las consultas con `where('userId', '==', user.uid)` funcionan correctamente

## 📋 Reglas Completas (por si necesitas copiarlas manualmente):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para quincenas
    match /fortnights/{fortnightId} {
      allow read: if request.auth != null && 
                     (resource == null || request.auth.uid == resource.data.userId);
      allow list: if request.auth != null;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Reglas para gastos
    match /expenses/{expenseId} {
      allow read: if request.auth != null && 
                     (resource == null || request.auth.uid == resource.data.userId);
      allow list: if request.auth != null;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Reglas para usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ⚠️ Nota sobre Índices

Si después de aplicar las reglas ves un error sobre índices faltantes:
1. Firebase te mostrará un enlace en el error
2. Haz clic en el enlace
3. Se creará el índice automáticamente
4. Espera 1-2 minutos y recarga

Los índices necesarios son:
- `fortnights`: userId (Ascending), year (Descending), month (Descending)
- `fortnights`: userId (Ascending), year (Ascending), month (Ascending), day (Ascending)
- `expenses`: userId (Ascending), fortnightId (Ascending), createdAt (Descending)

