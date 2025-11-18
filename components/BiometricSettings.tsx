// /components/BiometricSettings.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShield, FiCheck, FiX, FiAlertCircle, FiAlertTriangle, FiLock } from 'react-icons/fi'
import { MdFingerprint as FiFingerprint } from "react-icons/md";
import { useBiometricAuth } from '@/lib/hooks/useBiometricAuth'
import ConfirmModal from '@/components/ConfirmModal'

export default function BiometricSettings() {
  const biometric = useBiometricAuth()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [testAuth, setTestAuth] = useState(false)

  const handleToggleBiometric = async () => {
    if (biometric.isRegistered) {
      // Mostrar modal de confirmación para desactivar
      setShowDisableModal(true)
    } else {
      // Mostrar modal para ingresar contraseña
      setShowPasswordModal(true)
      setPassword('')
      setPasswordError('')
    }
  }

  const confirmActivate = async () => {
    if (!password.trim()) {
      setPasswordError('Por favor ingresa tu contraseña')
      return
    }

    setPasswordError('')
    
    // Activar con la contraseña
    const success = await biometric.register(password)
    
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      setShowPasswordModal(false)
      setPassword('')
    } else {
      setPasswordError('Error al activar biometría. Verifica tu contraseña.')
    }
  }

  const confirmDisable = async () => {
    const success = await biometric.unregister()
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
    setShowDisableModal(false)
  }

  const handleTestAuth = async () => {
    setTestAuth(true)
    const success = await biometric.authenticate()
    setTestAuth(false)
    
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  return (
    <div>
      {/* Alerta: Biometría no disponible */}
      {!biometric.isAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                Biometría no disponible
              </h3>
              <p className="text-sm text-yellow-700">
                Tu navegador o dispositivo no soporta autenticación biométrica.
                Requiere Chrome, Safari o Edge en un dispositivo compatible.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mensaje de éxito */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-800">
                ¡Operación exitosa!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {biometric.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <FiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-sm text-red-700">{biometric.error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card principal */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={handleToggleBiometric}
          disabled={!biometric.isAvailable || biometric.loading}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              biometric.isRegistered 
                ? 'bg-green-100' 
                : 'bg-gray-100'
            }`}>
              {biometric.isRegistered ? (
                <FiCheck className="w-5 h-5 text-green-600" />
              ) : (
                <FiFingerprint className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">
                {biometric.getBiometricName()}
              </p>
              <p className="text-sm text-gray-500">
                {biometric.isRegistered 
                  ? 'Activado - Toca para desactivar' 
                  : 'Desactivado - Toca para activar'}
              </p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              biometric.isRegistered 
                ? 'bg-green-500' 
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                biometric.isRegistered ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </div>
        </button>

        {/* Información adicional cuando está activada */}
        {biometric.isRegistered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 p-4 bg-gray-50"
          >
            <div className="space-y-3">
              {/* Info */}
              <div className="flex items-start gap-3 text-sm">
                <FiShield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600">
                  Tu biometría está registrada en este dispositivo. Podrás iniciar sesión 
                  rápidamente usando {biometric.getBiometricName()}.
                </p>
              </div>

              {/* Botón de prueba */}
              <button
                onClick={handleTestAuth}
                disabled={biometric.loading || testAuth}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {biometric.loading || testAuth ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <FiFingerprint className="w-4 h-4" />
                    Probar autenticación
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Información cuando no está activada */}
        {!biometric.isRegistered && biometric.isAvailable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-gray-100 p-4 bg-gray-50"
          >
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <FiShield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p>Agrega una capa extra de seguridad a tu cuenta</p>
              </div>
              <div className="flex items-start gap-2">
                <FiFingerprint className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p>Inicia sesión de forma rápida y segura con tu {biometric.getBiometricName()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal para ingresar contraseña */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiLock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Confirma tu contraseña
                  </h3>
                  <p className="text-sm text-gray-500">
                    Para activar la biometría
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Por seguridad, necesitamos verificar tu contraseña antes de activar 
                  la autenticación biométrica.
                </p>

                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && confirmActivate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  autoFocus
                />

                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 text-sm mt-2"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPassword('')
                    setPasswordError('')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmActivate}
                  disabled={biometric.loading}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {biometric.loading ? 'Activando...' : 'Activar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación para desactivar */}
      <ConfirmModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={confirmDisable}
        title="¿Desactivar biometría?"
        message="Si desactivas la autenticación biométrica, tendrás que usar tu usuario y contraseña para iniciar sesión."
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        type="warning"
        icon={<FiAlertTriangle className="w-8 h-8" />}
      />
    </div>
  )
}