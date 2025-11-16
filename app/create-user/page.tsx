'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiArrowLeft } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

export default function CreateUserPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      if (!auth || typeof auth === 'object' && Object.keys(auth).length === 0) {
        setError('Firebase no está inicializado. Por favor recarga la página.')
        setLoading(false)
        return
      }

      const email = username.includes('@') ? username : `${username}@gastos.com`
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Inicializar datos del usuario
        try {
          const { initializeUserData } = await import('@/lib/firebase/initUser')
          await initializeUserData(userCredential.user.uid)
        } catch (initError) {
          console.error('Error inicializando usuario:', initError)
        }
        
        setSuccess(`¡Usuario ${username} creado exitosamente! Redirigiendo...`)
        
        // Esperar un momento y luego redirigir
        setTimeout(() => {
          router.push('/home')
        }, 2000)
      } catch (createError: any) {
        console.log('Create error:', createError.code, createError.message)
        
        if (createError.code === 'auth/email-already-in-use') {
          setError('Este usuario ya existe. Puedes iniciar sesión con él.')
        } else if (createError.code === 'auth/weak-password') {
          setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.')
        } else if (createError.code === 'auth/invalid-email') {
          setError('El formato del email no es válido')
        } else if (createError.code === 'auth/operation-not-allowed') {
          setError('La autenticación por email/contraseña no está habilitada en Firebase.')
        } else {
          setError(`Error al crear usuario: ${createError.message || 'Error desconocido'}`)
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError(error.message || 'Error inesperado. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 transition"
        >
          <FiArrowLeft className="w-5 h-5" />
          Volver al Login
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Crear Nuevo Usuario
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Crea una cuenta para gestionar tus gastos
          </p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
          >
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Usuario
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Contraseña
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando usuario...' : 'Crear Usuario'}
            </button>
          </motion.form>
        </motion.div>
      </div>
      <Watermark />
    </div>
  )
}

