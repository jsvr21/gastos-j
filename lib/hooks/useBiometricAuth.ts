// /hooks/useBiometricAuth.ts
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { signInWithCustomToken } from 'firebase/auth'
import { saveSecureCredentials, getSecureCredentials, deleteSecureCredentials } from '@/lib/crypto/secureStorage'

interface BiometricCredential {
    credentialId: string
    publicKey: string
    userId: string
    userEmail: string
}

/**
 * Hook para manejar autenticación biométrica (WebAuthn)
 * Compatible con Touch ID, Face ID, Huella Digital, Windows Hello
 */
export function useBiometricAuth() {
    const [isAvailable, setIsAvailable] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAvailability()
        checkRegistrationStatus()
    }, [])

    // Verificar si WebAuthn está disponible
    const checkAvailability = () => {
        const available =
            typeof window !== 'undefined' &&
            window.PublicKeyCredential !== undefined &&
            navigator.credentials !== undefined

        setIsAvailable(available)
    }

    // Verificar si ya está registrada la biometría
    const checkRegistrationStatus = async () => {
        try {
            const user = auth.currentUser
            if (!user) return

            const userDoc = await getDoc(doc(db, 'users', user.uid))
            const userData = userDoc.data()

            setIsRegistered(userData?.biometricEnabled || false)
        } catch (err) {
            console.error('Error checking biometric status:', err)
        }
    }

    // Generar desafío aleatorio
    const generateChallenge = (): ArrayBuffer => {
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)
        return challenge.buffer
    }

    // Convertir ArrayBuffer a Base64
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    // Convertir Base64 a ArrayBuffer
    const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes.buffer
    }

    // Convertir base64url a ArrayBuffer (para WebAuthn)
    const base64urlToArrayBuffer = (base64url: string): ArrayBuffer => {
        // Convertir base64url a base64 estándar
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
        const padLength = (4 - (base64.length % 4)) % 4
        const padded = base64 + '='.repeat(padLength)
        
        return base64ToArrayBuffer(padded)
    }

    function toArrayBuffer(buf: any): ArrayBuffer {
        if (buf instanceof ArrayBuffer) return buf;
        if (buf.buffer instanceof ArrayBuffer) return buf.buffer;
        return Uint8Array.from(buf).buffer;
    }


    /**
     * REGISTRAR BIOMETRÍA para el usuario actual
     * @param password - Password del usuario para guardarlo de forma segura
     */
    const register = async (password: string): Promise<boolean> => {
        setLoading(true)
        setError(null)

        try {
            const user = auth.currentUser
            if (!user) {
                throw new Error('Usuario no autenticado')
            }

            if (!isAvailable) {
                throw new Error('Biometría no disponible en este dispositivo')
            }

            console.log('🔐 Iniciando registro de biometría...')
            const challenge = generateChallenge()

            // Detectar si es iOS/Safari
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            
            console.log('📱 Dispositivo:', { isIOS, isSafari, userAgent: navigator.userAgent })

            // Crear credencial biométrica - Configuración optimizada para iOS
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,

                    rp: {
                        name: 'Control de Gastos',
                        id: window.location.hostname === 'localhost'
                            ? 'localhost'
                            : window.location.hostname,
                    },

                    user: {
                        id: new TextEncoder().encode(user.uid).buffer,
                        name: user.email || 'usuario',
                        displayName: user.email?.split('@')[0] || 'Usuario',
                    },

                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },   // ES256 (preferido por iOS)
                        { alg: -257, type: 'public-key' }, // RS256 (Windows Hello)
                    ],

                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required',
                        requireResidentKey: true, // ← iOS requiere true
                        residentKey: 'required', // ← Explícito para iOS 14+
                    },

                    timeout: 60000,
                    attestation: 'direct', // ← iOS prefiere 'direct' o 'indirect'
                },
            }) as PublicKeyCredential;


            if (!credential) {
                throw new Error('No se pudo crear la credencial')
            }

            console.log('✅ Credencial creada:', {
                id: credential.id,
                type: credential.type,
                rawId: credential.rawId
            })

            // Extraer datos de la credencial - Compatible con iOS
            const response = credential.response as AuthenticatorAttestationResponse
            
            let publicKey: string
            try {
                const rawPublicKey = response.getPublicKey()
                
                if (!rawPublicKey) {
                    console.warn('⚠️ No se pudo obtener publicKey, usando credentialId')
                    // Fallback: usar el credentialId como referencia
                    const encoded = new TextEncoder().encode(credential.id)
                    publicKey = arrayBufferToBase64(encoded.buffer)
                } else {
                    publicKey = arrayBufferToBase64(toArrayBuffer(rawPublicKey))
                }
            } catch (err) {
                console.warn('⚠️ Error extrayendo publicKey, usando credentialId como fallback:', err)
                const encoded = new TextEncoder().encode(credential.id)
                publicKey = arrayBufferToBase64(encoded.buffer)
            }

            // Guardar en Firestore
            console.log('💾 Guardando credenciales en Firestore...')
            await setDoc(
                doc(db, 'users', user.uid),
                {
                    biometricEnabled: true,
                    biometricCredentialId: credential.id,
                    biometricPublicKey: publicKey,
                    biometricRegisteredAt: new Date(),
                    email: user.email,
                    // Guardar info del dispositivo para debugging
                    biometricDevice: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                    }
                },
                { merge: true }
            )
            console.log('✅ Credenciales guardadas en Firestore')

            // Guardar también en localStorage para login rápido
            console.log('💾 Guardando en localStorage...')
            localStorage.setItem('biometric_user_id', user.uid)
            localStorage.setItem('biometric_credential_id', credential.id)
            localStorage.setItem('biometric_user_email', user.email || '')
            
            // Guardar credenciales encriptadas de forma segura
            console.log('🔐 Guardando credenciales encriptadas...')
            try {
                await saveSecureCredentials(user.uid, user.email || '', password)
                console.log('✅ Credenciales encriptadas guardadas')
            } catch (storageErr) {
                console.error('⚠️ Error guardando credenciales encriptadas (no crítico):', storageErr)
                // No fallar si esto falla, la biometría ya está registrada
            }

            console.log('✅ Biometría registrada exitosamente')
            setIsRegistered(true)
            setLoading(false)
            return true
        } catch (err: any) {
            console.error('❌ Error registrando biometría:', err)

            let errorMessage = 'Error al registrar biometría'

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Permiso denegado. Permite el acceso a Face ID/Touch ID en Ajustes → Safari → Cámara y Micrófono.'
            } else if (err.name === 'NotSupportedError') {
                errorMessage = 'Biometría no soportada. Usa Safari en iOS 14+ o Chrome/Edge en escritorio.'
            } else if (err.name === 'InvalidStateError') {
                errorMessage = 'Ya existe una credencial. Desactívala primero o usa otro dispositivo.'
            } else if (err.name === 'AbortError') {
                errorMessage = 'Operación cancelada. Intenta de nuevo.'
            } else if (err.name === 'SecurityError') {
                errorMessage = 'Error de seguridad. Verifica que estés usando HTTPS o localhost.'
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
            setLoading(false)
            return false
        }
    }

    /**
     * AUTENTICAR con biometría (LOGIN)
     */
    const authenticate = async (): Promise<boolean> => {
        setLoading(true)
        setError(null)

        try {
            // Obtener user ID guardado
            const savedUserId = localStorage.getItem('biometric_user_id')
            const savedCredentialId = localStorage.getItem('biometric_credential_id')

            if (!savedUserId || !savedCredentialId) {
                throw new Error('No hay credenciales biométricas guardadas. Registra primero.')
            }

            const challenge = generateChallenge()
            
            // Autenticar con biometría
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
                    userVerification: 'required',
                    allowCredentials: [{
                        id: base64urlToArrayBuffer(savedCredentialId),
                        type: 'public-key',
                        transports: ['internal'] as AuthenticatorTransport[],
                    }],
                },
            }) as PublicKeyCredential

            if (!assertion) {
                throw new Error('Autenticación fallida')
            }

            console.log('✅ Autenticación biométrica exitosa')

            // Biometría verificada exitosamente
            setLoading(false)
            return true
        } catch (err: any) {
            console.error('Error autenticando con biometría:', err)

            let errorMessage = 'Error al autenticar'

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Autenticación cancelada o denegada'
            } else if (err.name === 'InvalidStateError') {
                errorMessage = 'No se encontró la credencial. Regístrala nuevamente.'
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
            setLoading(false)
            return false
        }
    }

    /**
     * DESREGISTRAR biometría
     */
    const unregister = async (): Promise<boolean> => {
        setLoading(true)
        setError(null)

        try {
            const user = auth.currentUser
            if (!user) {
                throw new Error('Usuario no autenticado')
            }

            await setDoc(
                doc(db, 'users', user.uid),
                {
                    biometricEnabled: false,
                    biometricCredentialId: null,
                    biometricPublicKey: null,
                },
                { merge: true }
            )

            // Limpiar localStorage
            localStorage.removeItem('biometric_user_id')
            localStorage.removeItem('biometric_credential_id')
            localStorage.removeItem('biometric_user_email')
            
            // Eliminar credenciales seguras
            await deleteSecureCredentials()

            setIsRegistered(false)
            setLoading(false)
            return true
        } catch (err) {
            console.error('Error desregistrando biometría:', err)
            setError('Error al desactivar biometría')
            setLoading(false)
            return false
        }
    }

    /**
     * Obtener datos del usuario guardado (para el login) - LEGACY
     */
    const getSavedUserEmail = async (): Promise<string | null> => {
        try {
            const credentials = await getSecureCredentials()
            return credentials?.email || null
        } catch (err) {
            console.error('Error obteniendo email:', err)
            return null
        }
    }

    /**
     * Obtener credenciales completas (email + password desencriptado)
     */
    const getSecureUserCredentials = async (): Promise<{
        email: string
        password: string
    } | null> => {
        try {
            const credentials = await getSecureCredentials()
            if (!credentials) return null
            
            return {
                email: credentials.email,
                password: credentials.password
            }
        } catch (err) {
            console.error('Error obteniendo credenciales seguras:', err)
            return null
        }
    }

    /**
     * Obtener nombre del método biométrico
     */
    const getBiometricName = (): string => {
        if (typeof window === 'undefined') return 'Biometría'

        const ua = navigator.userAgent.toLowerCase()

        if (ua.includes('iphone') || ua.includes('ipad')) {
            return 'Face ID / Touch ID'
        } else if (ua.includes('android')) {
            return 'Huella Digital'
        } else if (ua.includes('windows')) {
            return 'Windows Hello'
        } else if (ua.includes('mac')) {
            return 'Touch ID'
        }

        return 'Biometría'
    }

    /**
     * Verificar si hay credenciales guardadas
     */
    const hasStoredCredentials = (): boolean => {
        return !!(
            localStorage.getItem('biometric_user_id') &&
            localStorage.getItem('biometric_credential_id')
        )
    }

    return {
        isAvailable,
        isRegistered,
        loading,
        error,
        register,
        authenticate,
        unregister,
        getBiometricName,
        getSavedUserEmail,
        getSecureUserCredentials,
        hasStoredCredentials,
    }
}