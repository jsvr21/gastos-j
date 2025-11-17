# Configuración de Firebase Authentication

## ⚠️ IMPORTANTE: Habilitar Email/Password Authentication

El error 400 que estás viendo significa que **Firebase Authentication no está habilitado** o el método **Email/Password** no está activado.

### Pasos para habilitar la autenticación:

1. **Ve a la Consola de Firebase:**
   - Abre: https://console.firebase.google.com/
   - Selecciona tu proyecto: `gastos-a9062`

2. **Habilita Authentication:**
   - En el menú lateral, haz clic en **"Authentication"** (Autenticación)
   - Si es la primera vez, haz clic en **"Comenzar"** o **"Get started"**

3. **Habilita el método Email/Password:**
   - En la pestaña **"Sign-in method"** (Método de inicio de sesión)
   - Busca **"Correo electrónico/Contraseña"** o **"Email/Password"**
   - Haz clic en él
   - **Habilita** el primer toggle (Email/Password)
   - Haz clic en **"Guardar"** o **"Save"**

4. **Verifica la configuración:**
   - Asegúrate de que el toggle esté en **"Habilitado"** (Enabled)
   - No es necesario habilitar "Email link (passwordless sign-in)" a menos que lo necesites

### Crear el usuario inicial manualmente (Opcional):

Si quieres crear el usuario `jormanstiv` manualmente:

1. Ve a **Authentication** > **Users** (Usuarios)
2. Haz clic en **"Add user"** (Agregar usuario)
3. Email: `jormanstiv@gastos.com`
4. Password: `12345jorman`
5. Haz clic en **"Add user"**

**Nota:** La aplicación creará automáticamente el usuario la primera vez que intentes iniciar sesión, pero solo si Email/Password está habilitado.

### Verificar que todo funciona:

1. Después de habilitar Email/Password, recarga la aplicación
2. Intenta iniciar sesión con:
   - Usuario: `jormanstiv`
   - Contraseña: `12345jorman`
3. Si el usuario no existe, se creará automáticamente
4. Si ya existe, iniciarás sesión normalmente

### Solución de problemas:

- **Error 400:** Email/Password no está habilitado → Sigue los pasos arriba
- **Error 403:** Problemas de permisos → Verifica las reglas de Firestore
- **Error de red:** Verifica tu conexión a internet
- **Usuario no se crea:** Verifica que Email/Password esté habilitado

