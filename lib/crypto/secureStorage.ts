// /lib/crypto/secureStorage.ts
/**
 * Almacenamiento seguro con encriptación Web Crypto API
 * NO usa localStorage - usa IndexedDB que es más seguro
 */

const DB_NAME = 'SecureAuthDB'
const STORE_NAME = 'credentials'
const DB_VERSION = 1

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
    console.error('Error encriptando:', error)
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
    console.error('Error desencriptando:', error)
    throw new Error('Error al desencriptar datos')
  }
}

/**
 * Guardar credenciales de forma segura
 */
export const saveSecureCredentials = async (
  userId: string,
  email: string,
  password: string
): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    // Encriptar password
    const encryptedPassword = await encrypt(password, userId)
    
    // Guardar en IndexedDB
    const credentials = {
      userId,
      email,
      encryptedPassword,
      timestamp: Date.now()
    }
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(credentials, 'biometric_credentials')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    db.close()
  } catch (error) {
    console.error('Error guardando credenciales:', error)
    throw new Error('Error al guardar credenciales seguras')
  }
}

/**
 * Obtener credenciales seguras
 */
export const getSecureCredentials = async (): Promise<{
  userId: string
  email: string
  password: string
} | null> => {
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
    
    if (!credentials) return null
    
    // Desencriptar password
    const password = await decrypt(credentials.encryptedPassword, credentials.userId)
    
    return {
      userId: credentials.userId,
      email: credentials.email,
      password
    }
  } catch (error) {
    console.error('Error obteniendo credenciales:', error)
    return null
  }
}

/**
 * Eliminar credenciales seguras
 */
export const deleteSecureCredentials = async (): Promise<void> => {
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
  } catch (error) {
    console.error('Error eliminando credenciales:', error)
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