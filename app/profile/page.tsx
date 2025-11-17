'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged, updatePassword, User } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { 
  FiUser, FiMail, FiCalendar, FiDollarSign, FiLogOut, 
  FiArrowLeft, FiEdit2, FiShield, FiClock, FiTrendingUp,
  FiCheckCircle, FiSettings, FiCode, FiHome, FiPlus
} from 'react-icons/fi'
import Image from 'next/image'

interface UserStats {
  totalFortnights: number
  totalExpenses: number
  totalSpent: number
  totalPaid: number
  accountCreated: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [stats, setStats] = useState<UserStats>({
    totalFortnights: 0,
    totalExpenses: 0,
    totalSpent: 0,
    totalPaid: 0,
    accountCreated: ''
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/')
        return
      }
      
      setUser(currentUser)
      await loadUserStats(currentUser.uid)
      setLoading(false)
    })

    return unsubscribe
  }, [router])

  const loadUserStats = async (userId: string) => {
    try {
      // Cargar quincenas
      const fortnightsRef = collection(db, 'fortnights')
      const fortnightsQuery = query(fortnightsRef, where('userId', '==', userId))
      const fortnightsSnapshot = await getDocs(fortnightsQuery)
      
      let totalFortnights = 0
      let totalFromFortnights = 0
      
      fortnightsSnapshot.forEach((doc) => {
        totalFortnights++
        const data = doc.data()
        if (data.total) {
          totalFromFortnights += data.total
        }
      })

      // Cargar gastos
      const expensesRef = collection(db, 'expenses')
      const expensesQuery = query(expensesRef, where('userId', '==', userId))
      const expensesSnapshot = await getDocs(expensesQuery)
      
      let totalExpenses = 0
      let totalSpent = 0
      let totalPaid = 0
      
      expensesSnapshot.forEach((doc) => {
        totalExpenses++
        const data = doc.data()
        if (data.amount) {
          totalSpent += data.amount
          if (data.paid) {
            totalPaid += data.amount
          }
        }
      })

      // Fecha de creación - usando el currentUser actualizado
      const currentUser = auth.currentUser
      const accountCreated = currentUser?.metadata?.creationTime 
        ? new Date(currentUser.metadata.creationTime).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'No disponible'

      setStats({
        totalFortnights,
        totalExpenses,
        totalSpent,
        totalPaid,
        accountCreated
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await signOut(auth)
      router.push('/')
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    
    if (!newPassword || !confirmPassword) {
      setPasswordError('Por favor completa ambos campos')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      if (user) {
        await updatePassword(user, newPassword)
        alert('Contraseña actualizada exitosamente')
        setShowPasswordChange(false)
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Por seguridad, necesitas iniciar sesión nuevamente para cambiar tu contraseña')
      } else {
        setPasswordError('Error al cambiar la contraseña: ' + error.message)
      }
    }
  }

  const getUserName = () => {
    if (!user?.email) return 'Usuario'
    return user.email.split('@')[0]
  }

  const getInitials = () => {
    const name = getUserName()
    return name.substring(0, 2).toUpperCase()
  }

  const handleAddFortnight = () => {
    router.push('/add-fortnight')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header con gradiente y marca */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden pb-24">
        {/* Marca de agua en el header */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-8 text-white/10 text-5xl font-bold transform rotate-12">
            JormanDEV
          </div>
          <div className="absolute bottom-4 left-8 text-white/10 text-3xl font-bold transform -rotate-12">
            &lt;/&gt;
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-white/90 hover:text-white font-semibold mb-6 transition"
          >
            <FiArrowLeft className="w-5 h-5" />
            Atrás
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-purple-100">Gestiona tu información personal</p>
          </motion.div>
        </div>

        {/* Avatar flotante */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 flex justify-center"
          style={{ transform: 'translateY(50%)' }}
        >
          <div className="relative w-32 h-32">
            {/* Contenedor principal blanco */}
            <div className="w-full h-full rounded-full bg-white shadow-2xl p-2">
              {/* Contenedor del gradiente */}
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full p-[3px]">
                {/* Contenedor interno blanco con la imagen */}
                <div className="w-full h-full rounded-full bg-white p-2 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/icon.png"
                    alt="Profile"
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
            {/* Badge verificado */}
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <FiCheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Información del usuario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 mt-20"
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{getUserName()}</h2>
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2 mt-1">
              <FiMail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg py-3 px-4">
            <FiCalendar className="w-4 h-4 text-purple-600" />
            <span>Miembro desde {stats.accountCreated}</span>
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-purple-600" />
            Mis Estadísticas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalFortnights}</p>
              <p className="text-sm text-gray-500">Quincenas</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalExpenses}</p>
              <p className="text-sm text-gray-500">Gastos</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">
                ${stats.totalSpent.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-500">Total Gastado</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">
                ${stats.totalPaid.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-500">Total Pagado</p>
            </div>
          </div>
        </motion.div>

        {/* Opciones de cuenta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-purple-600" />
            Configuración
          </h3>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Cambiar Contraseña</p>
                  <p className="text-sm text-gray-500">Actualiza tu contraseña</p>
                </div>
              </div>
              <FiEdit2 className="w-5 h-5 text-gray-400" />
            </button>

            {showPasswordChange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 border-b border-gray-100"
              >
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900"
                  />
                  {passwordError && (
                    <p className="text-red-600 text-sm">{passwordError}</p>
                  )}
                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </motion.div>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition text-red-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiLogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Cerrar Sesión</p>
                  <p className="text-sm text-gray-500">Salir de tu cuenta</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Marca personal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <FiCode className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Desarrollado por</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">JormanDEV</p>
          <p className="text-purple-100 text-sm">Control de Gastos Quincenales</p>
          <p className="text-purple-200 text-xs mt-2">© 2024 - Todos los derechos reservados</p>
        </motion.div>
      </div>

      {/* Menú inferior estilo móvil */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => {
                setActiveTab('home')
                router.push('/home')
              }}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiHome className="w-6 h-6" />
              <span className="text-xs font-semibold">Inicio</span>
            </button>

            <button
              onClick={handleAddFortnight}
              className="flex flex-col items-center gap-1 -mt-6 relative"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95">
                <FiPlus className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">Agregar</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FiUser className="w-6 h-6" />
              <span className="text-xs font-semibold">Perfil</span>
            </button>
          </div>
        </div>

        {/* Mini marca de agua en el menú */}
        <div className="text-center pb-1">
          <p className="text-gray-300 text-[10px] font-semibold">JormanDEV © 2024</p>
        </div>
      </motion.div>
    </div>
  )
}