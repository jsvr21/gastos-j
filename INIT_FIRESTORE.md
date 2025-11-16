# Inicialización de Firestore

## ✅ No necesitas crear documentos vacíos

Firestore funciona de manera diferente a las bases de datos tradicionales:

- **Las colecciones se crean automáticamente** cuando agregas el primer documento
- **No necesitas crear documentos vacíos** - la aplicación los creará cuando los necesites
- **Las consultas funcionan correctamente** incluso cuando no hay documentos (retornan resultados vacíos)

## 🚀 La aplicación ya está configurada para:

1. **Crear automáticamente** la estructura cuando un usuario se registra
2. **Manejar correctamente** el caso cuando no hay datos (muestra "No hay meses registrados")
3. **Crear documentos** cuando agregas tu primera quincena o gasto

## 📋 Estructura que se creará automáticamente:

### Cuando te registras:
- Se crea un documento en la colección `users` con tu información básica

### Cuando agregas tu primera quincena:
- Se crea un documento en la colección `fortnights` con:
  - `userId`: Tu ID de usuario
  - `year`: Año
  - `month`: Mes (1-12)
  - `day`: Día de la quincena (15 o 30)
  - `total`: Total de dinero
  - `createdAt`: Fecha de creación

### Cuando agregas tu primer gasto:
- Se crea un documento en la colección `expenses` con:
  - `userId`: Tu ID de usuario
  - `fortnightId`: ID de la quincena
  - `name`: Nombre del gasto
  - `amount`: Monto
  - `description`: Descripción (opcional)
  - `createdAt`: Fecha de creación

## 🎯 Para empezar a usar la aplicación:

1. **Inicia sesión** o crea un usuario
2. **Haz clic en "Agregar Quincena"**
3. **Agrega tu primera quincena** con el total de dinero
4. **Agrega gastos** a esa quincena

¡Eso es todo! Los documentos se crearán automáticamente.

## ⚠️ Importante:

- Asegúrate de que las **reglas de Firestore estén configuradas** (ver `FIRESTORE_RULES_SETUP.md`)
- Asegúrate de que **Email/Password esté habilitado** en Authentication
- Los datos se guardan automáticamente en Firebase

## 🔍 Ver tus datos en Firebase Console:

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: `gastos-a9062`
3. Ve a **Firestore Database**
4. Verás las colecciones `fortnights` y `expenses` cuando agregues datos


