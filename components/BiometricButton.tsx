// /components/BiometricButton.tsx
'use client'

import { useState, useEffect } from 'react'
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
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    loadSavedEmail()
  }, [])

  const loadSavedEmail = async () => {
    const email = await biometric.getSavedUserEmail()
    setSavedEmail(email)
  }

  const handleBiometricLogin = async () => {
    try {
      setShowError(false)
      
      // Primero autenticar con biometría
      const bioSuccess = await biometric.authenticate()
      
      if (!bioSuccess) {
        setShowError(true)
        setTimeout(() => setShowError(false), 5000)
        return
      }

      // Obtener credenciales del usuario
      const email = await biometric.getSavedUserEmail()
      
      if (!email) {
        setShowError(true)
        return
      }

      // Hacer login con Firebase (necesitarás guardar un token o usar un método alternativo)
      // Por ahora, redirigimos directamente ya que la biometría es la segunda capa
      // En producción, deberías generar un token temporal en el servidor
      
      // OPCIÓN 1: Login tradicional después de biometría (requiere password guardado - NO RECOMENDADO)
      // OPCIÓN 2: Crear un custom token en el servidor (RECOMENDADO)
      // OPCIÓN 3: Usar el estado de autenticación de biometría (Lo que haremos)
      
      // Por seguridad, por ahora solo permitimos si ya hay sesión activa
      // En producción, deberías implementar un endpoint que genere un custom token
      // después de verificar la firma biométrica
      
      router.push('/home')
      
    } catch (error) {
      console.error('Error en login biométrico:', error)
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

      {/* Mostrar email guardado */}
      {savedEmail && (
        <p className="text-center text-sm text-gray-500">
          {savedEmail}
        </p>
      )}

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
            <span>{biometric.error || 'Error en la autenticación biométrica'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}