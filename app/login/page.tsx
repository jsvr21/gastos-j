// /app/page.tsx (o donde tengas el login)
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiCode } from 'react-icons/fi'
import Image from 'next/image'
import BiometricButton from '@/components/BiometricButton'

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
      if (!auth || typeof auth === 'object' && Object.keys(auth).length === 0) {
        setError('El sistema no está disponible. Por favor recarga la página.')
        setLoading(false)
        return
      }

      const email = username.includes('@') ? username : `${username}@gastos.com`
      
      try {
        await signInWithEmailAndPassword(auth, email, password)
        router.push('/home')
      } catch (signInError: any) {
        console.log('Sign in error:', signInError.code, signInError.message)
        
        if (signInError.code === 'auth/user-not-found') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
              setError('La contraseña es muy débil. Debe tener al menos 6 caracteres')
            } else if (createError.code === 'auth/invalid-email') {
              setError('El formato del usuario no es válido')
            } else if (createError.code === 'auth/operation-not-allowed') {
              setError('El sistema de autenticación no está disponible. Contacta al administrador')
            } else {
              setError('Error al crear el usuario. Por favor intenta de nuevo')
            }
          }
        } else if (signInError.code === 'auth/wrong-password') {
          setError('Contraseña incorrecta')
        } else if (signInError.code === 'auth/invalid-email') {
          setError('El formato del usuario no es válido')
        } else if (signInError.code === 'auth/invalid-credential') {
          setError('Usuario o contraseña incorrectos')
        } else if (signInError.code === 'auth/too-many-requests') {
          setError('Demasiados intentos fallidos. Por favor intenta más tarde')
        } else if (signInError.code === 'auth/operation-not-allowed') {
          setError('El sistema de autenticación no está disponible. Contacta al administrador')
        } else if (signInError.code === 'auth/network-request-failed') {
          setError('Error de conexión. Verifica tu conexión a internet')
        } else if (signInError.code === 'auth/user-disabled') {
          setError('Esta cuenta ha sido deshabilitada. Contacta al administrador')
        } else {
          setError('Credenciales incorrectas. Verifica tu usuario y contraseña')
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError('Error inesperado. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Marcas de agua decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-white/5 text-6xl font-bold transform -rotate-12">
          JormanDEV
        </div>
        <div className="absolute bottom-20 right-10 text-white/5 text-6xl font-bold transform rotate-12">
          JormanDEV
        </div>
        <div className="absolute top-1/2 left-1/4 text-white/5 text-4xl font-bold transform -rotate-45">
          &lt;/&gt;
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/5 text-4xl font-bold transform rotate-45">
          &lt;/&gt;
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo y título */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mx-auto w-24 h-24 mb-6 relative"
          >
            <div className="absolute inset-0 bg-white rounded-full shadow-2xl"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full p-1 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                <Image
                  src="/icon.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 border-4 border-white rounded-full"
            ></motion.div>
          </motion.div>

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
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6 relative"
        >
          {/* Marca de agua sutil dentro del formulario */}
          <div className="absolute top-4 right-4 text-gray-200 text-xs font-semibold flex items-center gap-1">
            <FiCode className="w-3 h-3" />
            JormanDEV
          </div>

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

          {/* BOTÓN DE BIOMETRÍA */}
          <BiometricButton />

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

        {/* Footer con marca personal destacada */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 inline-block">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FiCode className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Desarrollado por</p>
                <p className="text-purple-200 font-bold">JormanDEV</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marca de agua adicional inferior */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-4"
        >
          <p className="text-purple-300/60 text-xs font-semibold tracking-wider">
            © 2024 JormanDEV - Todos los derechos reservados
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}