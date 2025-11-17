# 🔥 Crear Índices en Firestore

## ⚠️ IMPORTANTE: Crear los Índices Necesarios

Firebase te está pidiendo que crees índices para las consultas. Sigue estos pasos:

### Opción 1: Crear Índice Automáticamente (MÁS FÁCIL)

1. **Haz clic en el enlace** que aparece en el error de la consola
   - Debería ser algo como: `https://console.firebase.google.com/v1/r/project/gastos-a9062/...`
   - Este enlace te llevará directamente a crear el índice

2. **Haz clic en "Crear Índice"** en la página que se abre

3. **Espera 1-2 minutos** mientras se crea el índice

4. **Recarga la aplicación** (F5)

### Opción 2: Crear Índices Manualmente

1. Ve a: https://console.firebase.google.com/
2. Selecciona: **gastos-a9062**
3. Ve a: **Firestore Database** → Pestaña **"Índices"**
4. Haz clic en **"Crear Índice"**

#### Índice 1: Para consultar quincenas por mes
- **Colección**: `fortnights`
- **Campos**:
  - `userId` (Ascendente)
  - `year` (Ascendente)
  - `month` (Ascendente)
  - `day` (Ascendente)
- **Tipo de consulta**: Colección

#### Índice 2: Para listar meses (si es necesario)
- **Colección**: `fortnights`
- **Campos**:
  - `userId` (Ascendente)
  - `year` (Descendente)
  - `month` (Descendente)
- **Tipo de consulta**: Colección

#### Índice 3: Para gastos
- **Colección**: `expenses`
- **Campos**:
  - `userId` (Ascendente)
  - `fortnightId` (Ascendente)
  - `createdAt` (Descendente)
- **Tipo de consulta**: Colección

### ⏱️ Tiempo de Creación

Los índices pueden tardar **1-5 minutos** en crearse. Verás un estado "Creando..." que cambiará a "Habilitado" cuando esté listo.

### ✅ Verificar que Funcionó

1. Espera a que el índice esté "Habilitado"
2. Recarga la aplicación (F5)
3. Intenta ver los meses
4. Debería funcionar sin errores

## 📋 Nota

He modificado la aplicación para que:
- ✅ Muestre **todos los meses** (año actual, anterior y siguiente)
- ✅ Permita crear quincenas en **cualquier mes**
- ✅ Permita agregar gastos a **meses anteriores**
- ✅ No falle si faltan índices (solo muestra lista vacía)

¡Ahora puedes trabajar con cualquier mes sin problemas!

