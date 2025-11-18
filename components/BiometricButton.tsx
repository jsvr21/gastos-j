// /components/BiometricButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertCircle } from 'react-icons/fi'
import { MdFingerprint as FiFingerprint } from "react-icons/md";
import { useBiometricAuth } from '@/lib/hooks/useBiometricAuth'

export default function BiometricButton() {
  const router = useRouter()
  const biometric = useBiometricAuth()
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleBiometricLogin = async () => {
    try {
      setShowError(false)
      setErrorMessage('')
      
      // Primero autenticar con biometría (solo verifica la huella/rostro)
      const bioSuccess = await biometric.authenticate()
      
      if (!bioSuccess) {
        setErrorMessage('Autenticación biométrica fallida')
        setShowError(true)
        setTimeout(() => setShowError(false), 5000)
        return
      }

      // Biometría verificada, ahora obtener credenciales seguras
      const credentials = await biometric.getSecureUserCredentials()
      
      if (!credentials) {
        setErrorMessage('No se encontraron credenciales guardadas')
        setShowError(true)
        return
      }

      // Hacer login real con Firebase usando las credenciales desencriptadas
      try {
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        // Login exitoso, redirigir
        router.push('/home')
      } catch (loginError: any) {
        console.error('Error en login:', loginError)
        
        if (loginError.code === 'auth/wrong-password' || loginError.code === 'auth/user-not-found') {
          setErrorMessage('Credenciales inválidas. Reactiva la biometría desde tu perfil.')
        } else if (loginError.code === 'auth/too-many-requests') {
          setErrorMessage('Demasiados intentos. Espera unos minutos.')
        } else {
          setErrorMessage('Error al iniciar sesión. Intenta nuevamente.')
        }
        setShowError(true)
      }
      
    } catch (error) {
      console.error('Error en login biométrico:', error)
      setErrorMessage('Error en la autenticación biométrica')
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    }
  }

  // No mostrar el botón si no está disponible o no hay credenciales guardadas
  if (!biometric.isAvailable || !biometric.hasStoredCredentials()) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Separador */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-semibold">
            O continúa con
          </span>
        </div>
      </div>

      {/* Botón de biometría */}
      <motion.button
        type="button"
        onClick={handleBiometricLogin}
        disabled={biometric.loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {biometric.loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span>Autenticando...</span>
          </>
        ) : (
          <>
            <FiFingerprint className="w-6 h-6" />
            <span>{biometric.getBiometricName()}</span>
          </>
        )}
      </motion.button>

      {/* Error de autenticación */}
      <AnimatePresence>
        {(showError || biometric.error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
          >
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage || biometric.error || 'Error en la autenticación biométrica'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}