// /lib/crypto/secureStorage.ts
/**
 * Almacenamiento seguro con encriptación Web Crypto API
 * Usa IndexedDB como primario y localStorage como fallback para iOS
 */

const DB_NAME = 'SecureAuthDB'
const STORE_NAME = 'credentials'
const DB_VERSION = 1
const LOCALSTORAGE_KEY = 'secure_biometric_credentials'

// Detectar si estamos en iOS
const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua)
}

// Abrir/crear base de datos IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// Generar clave de encriptación desde el userId (único por usuario)
const generateKey = async (userId: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(userId + '-secure-key-salt-2024')
  
  // Hash del userId para crear una clave derivada
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Importar como clave de encriptación
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encriptar datos
const encrypt = async (data: string, userId: string): Promise<string> => {
  try {
    const key = await generateKey(userId)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    // IV aleatorio para cada encriptación
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    )
    
    // Combinar IV + datos encriptados
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)
    
    // Convertir a base64 para almacenar (sin spread operator)
    let binary = ''
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i])
    }
    return btoa(binary)
  } catch (error) {
    console.error('❌ Error encriptando:', error)
    throw new Error('Error al encriptar datos')
  }
}

// Desencriptar datos
const decrypt = async (encryptedData: string, userId: string): Promise<string> => {
  try {
    const key = await generateKey(userId)
    
    // Decodificar desde base64 (sin spread operator)
    const base64Decoded = atob(encryptedData)
    const combined = new Uint8Array(base64Decoded.length)
    for (let i = 0; i < base64Decoded.length; i++) {
      combined[i] = base64Decoded.charCodeAt(i)
    }
    
    // Extraer IV y datos
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('❌ Error desencriptando:', error)
    throw new Error('Error al desencriptar datos')
  }
}

/**
 * Guardar en IndexedDB
 */
const saveToIndexedDB = async (credentials: any): Promise<boolean> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(credentials, 'biometric_credentials')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    db.close()
    console.log('✅ Credenciales guardadas en IndexedDB')
    return true
  } catch (error) {
    console.warn('⚠️ IndexedDB no disponible:', error)
    return false
  }
}

/**
 * Guardar en localStorage (fallback para iOS)
 */
const saveToLocalStorage = (credentials: any): void => {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(credentials))
    console.log('✅ Credenciales guardadas en localStorage (fallback)')
  } catch (error) {
    console.error('❌ Error guardando en localStorage:', error)
    throw new Error('No se pudo guardar en ningún storage')
  }
}

/**
 * Obtener desde IndexedDB
 */
const getFromIndexedDB = async (): Promise<any | null> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    const credentials = await new Promise<any>((resolve, reject) => {
      const request = store.get('biometric_credentials')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    db.close()
    
    if (credentials) {
      console.log('✅ Credenciales obtenidas de IndexedDB')
    }
    return credentials
  } catch (error) {
    console.warn('⚠️ Error leyendo IndexedDB:', error)
    return null
  }
}

/**
 * Obtener desde localStorage (fallback)
 */
const getFromLocalStorage = (): any | null => {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY)
    if (data) {
      console.log('✅ Credenciales obtenidas de localStorage (fallback)')
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('❌ Error leyendo localStorage:', error)
    return null
  }
}

/**
 * Eliminar de IndexedDB
 */
const deleteFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete('biometric_credentials')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    db.close()
    console.log('✅ Credenciales eliminadas de IndexedDB')
  } catch (error) {
    console.warn('⚠️ Error eliminando de IndexedDB:', error)
  }
}

/**
 * Eliminar de localStorage
 */
const deleteFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(LOCALSTORAGE_KEY)
    console.log('✅ Credenciales eliminadas de localStorage')
  } catch (error) {
    console.error('❌ Error eliminando de localStorage:', error)
  }
}

/**
 * Guardar credenciales de forma segura
 * Intenta IndexedDB primero, luego localStorage como fallback
 */
export const saveSecureCredentials = async (
  userId: string,
  email: string,
  password: string
): Promise<void> => {
  try {
    console.log('💾 Guardando credenciales seguras...')
    
    // Encriptar password
    const encryptedPassword = await encrypt(password, userId)
    
    // Preparar objeto de credenciales
    const credentials = {
      userId,
      email,
      encryptedPassword,
      timestamp: Date.now()
    }
    
    // Intentar guardar en IndexedDB
    const savedInIndexedDB = await saveToIndexedDB(credentials)
    
    // Siempre guardar también en localStorage como backup (especialmente para iOS)
    saveToLocalStorage(credentials)
    
    if (!savedInIndexedDB && !isIOSSafari()) {
      console.warn('⚠️ Solo se pudo guardar en localStorage')
    }
    
    console.log('✅ Credenciales guardadas exitosamente')
  } catch (error) {
    console.error('❌ Error guardando credenciales:', error)
    throw new Error('Error al guardar credenciales seguras')
  }
}

/**
 * Obtener credenciales seguras
 * Intenta IndexedDB primero, luego localStorage como fallback
 */
export const getSecureCredentials = async (): Promise<{
  userId: string
  email: string
  password: string
} | null> => {
  try {
    console.log('🔍 Buscando credenciales seguras...')
    
    // Intentar desde IndexedDB primero
    let credentials = await getFromIndexedDB()
    
    // Si no hay en IndexedDB, intentar localStorage
    if (!credentials) {
      console.log('⚠️ No hay credenciales en IndexedDB, intentando localStorage...')
      credentials = getFromLocalStorage()
    }
    
    if (!credentials) {
      console.log('⚠️ No se encontraron credenciales en ningún storage')
      return null
    }
    
    // Desencriptar password
    const password = await decrypt(credentials.encryptedPassword, credentials.userId)
    
    console.log('✅ Credenciales desencriptadas correctamente')
    
    return {
      userId: credentials.userId,
      email: credentials.email,
      password
    }
  } catch (error) {
    console.error('❌ Error obteniendo credenciales:', error)
    return null
  }
}

/**
 * Eliminar credenciales seguras de ambos storages
 */
export const deleteSecureCredentials = async (): Promise<void> => {
  try {
    console.log('🗑️ Eliminando credenciales seguras...')
    
    // Eliminar de ambos storages
    await deleteFromIndexedDB()
    deleteFromLocalStorage()
    
    console.log('✅ Credenciales eliminadas de todos los storages')
  } catch (error) {
    console.error('❌ Error eliminando credenciales:', error)
    throw new Error('Error al eliminar credenciales')
  }
}

/**
 * Verificar si existen credenciales guardadas
 */
export const hasSecureCredentials = async (): Promise<boolean> => {
  try {
    const credentials = await getSecureCredentials()
    return credentials !== null
  } catch (error) {
    return false
  }
}