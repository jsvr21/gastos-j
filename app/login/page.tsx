'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiUser, FiLock } from 'react-icons/fi'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Verificar que auth esté inicializado
      if (!auth || typeof auth === 'object' && Object.keys(auth).length === 0) {
        setError('Firebase no está inicializado. Por favor recarga la página.')
        setLoading(false)
        return
      }

      const email = username.includes('@') ? username : `${username}@gastos.com`
      
      try {
        // Intentar iniciar sesión primero
        await signInWithEmailAndPassword(auth, email, password)
        router.push('/home')
      } catch (signInError: any) {
        console.log('Sign in error:', signInError.code, signInError.message)
        
        // Si el usuario no existe, crearlo
        if (signInError.code === 'auth/user-not-found') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            // Inicializar datos del usuario
            try {
              const { initializeUserData } = await import('@/lib/firebase/initUser')
              await initializeUserData(userCredential.user.uid)
            } catch (initError) {
              console.error('Error inicializando usuario:', initError)
            }
            router.push('/home')
          } catch (createError: any) {
            console.log('Create error:', createError.code, createError.message)
            
            if (createError.code === 'auth/email-already-in-use') {
              setError('El usuario ya existe pero la contraseña es incorrecta')
            } else if (createError.code === 'auth/weak-password') {
              setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.')
            } else if (createError.code === 'auth/invalid-email') {
              setError('El formato del email no es válido')
            } else if (createError.code === 'auth/operation-not-allowed') {
              setError('La autenticación por email/contraseña no está habilitada en Firebase. Por favor habilítala en la consola de Firebase.')
            } else {
              setError(`Error al crear usuario: ${createError.message || 'Error desconocido'}`)
            }
          }
        } else if (signInError.code === 'auth/wrong-password') {
          setError('Contraseña incorrecta')
        } else if (signInError.code === 'auth/invalid-email') {
          setError('El formato del email no es válido')
        } else if (signInError.code === 'auth/operation-not-allowed') {
          setError('La autenticación por email/contraseña no está habilitada en Firebase. Por favor habilítala en la consola de Firebase.')
        } else if (signInError.code === 'auth/network-request-failed') {
          setError('Error de conexión. Verifica tu conexión a internet.')
        } else {
          setError(`Error al iniciar sesión: ${signInError.message || 'Error desconocido'}`)
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Control de Gastos
          </h1>
          <p className="text-purple-100 text-lg">
            Gestiona tus finanzas quincenales
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6"
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
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => router.push('/create-user')}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Crear usuario
              </button>
            </p>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-purple-200 text-sm">JormanViafaraDEV</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

