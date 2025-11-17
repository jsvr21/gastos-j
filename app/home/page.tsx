'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiPlus, FiLogOut, FiCalendar, FiHome, FiUser } from 'react-icons/fi'
import Image from 'next/image'
import Watermark from '@/components/Watermark'
import ConfirmModal from '@/components/ConfirmModal'

interface Month {
  year: number
  month: number
  monthName: string
}

export default function HomePage() {
  const router = useRouter()
  const [months, setMonths] = useState<Month[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('home')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/')
        return
      }

      const email = user.email || ''
      const name = email.split('@')[0]
      setUserName(name)

      // Inicializar datos del usuario si es necesario
      try {
        const { initializeUserData } = await import('@/lib/firebase/initUser')
        await initializeUserData(user.uid)
      } catch (error) {
        console.error('Error inicializando usuario:', error)
      }
    })

    return unsubscribe
  }, [router])

  useEffect(() => {
    loadMonths()
  }, [selectedYear])

  const loadMonths = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      // Crear lista de todos los meses del año seleccionado
      const monthsList: Month[] = []

      for (let month = 1; month <= 12; month++) {
        monthsList.push({
          year: selectedYear,
          month: month,
          monthName: getMonthName(month),
        })
      }

      // Ordenar: más recientes primero (diciembre a enero)
      monthsList.sort((a, b) => b.month - a.month)

      setMonths(monthsList)
    } catch (error) {
      console.error('Error loading months:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedYear) {
      loadMonths()
    }
  }, [selectedYear])

  const getMonthName = (month: number): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[month - 1] || ''
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleAddMonth = () => {
    router.push(`/add-fortnight`)
  }

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header con marca */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Marca de agua en el header */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 right-4 text-white/10 text-4xl font-bold transform rotate-12">
            JormanDEV
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-start"
          >
            <div className="flex items-center gap-4">
              {/* Logo pequeño en el header */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 relative flex-shrink-0"
              >
                <div className="absolute inset-0 bg-white rounded-full shadow-lg"></div>
                <div className="absolute inset-0.5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full p-1 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                    <Image
                      src="/icon.png"
                      alt="Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Hola, {userName}
                </h1>
                <p className="text-purple-100 text-sm mt-0.5">Gestiona tus finanzas</p>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Cerrar sesión"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleAddMonth}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl mb-6 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
        >
          <FiPlus className="w-5 h-5" />
          Agregar Quincena
        </motion.button>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Año
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white shadow-sm"
          >
            {getAvailableYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Meses de {selectedYear}</h2>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
            {months.length} meses
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {months.map((month, index) => {
              const currentDate = new Date()
              const isCurrentMonth = month.year === currentDate.getFullYear() &&
                month.month === currentDate.getMonth() + 1
              const isPastMonth = month.year < currentDate.getFullYear() ||
                (month.year === currentDate.getFullYear() && month.month < currentDate.getMonth() + 1)

              return (
                <motion.div
                  key={`${month.year}-${month.month}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/month?year=${month.year}&month=${month.month}`)}
                  className={`bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer border-2 active:scale-98 ${isCurrentMonth
                      ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50'
                      : isPastMonth
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCurrentMonth
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        <FiCalendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{month.monthName}</h3>
                        {isCurrentMonth && (
                          <span className="text-xs font-semibold text-purple-600">
                            Mes actual
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrentMonth
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                      <span className="text-xl">→</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Marca de agua al final del contenido */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 mb-4"
        >
          <p className="text-gray-400 text-xs">Desarrollado por JormanDEV</p>
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
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${activeTab === 'home'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <FiHome className="w-6 h-6" />
              <span className="text-xs font-semibold">Inicio</span>
            </button>

            <button
              onClick={handleAddMonth}
              className="flex flex-col items-center gap-1 -mt-6 relative"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95">
                <FiPlus className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">Agregar</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile')
                router.push('/profile')
              }}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${activeTab === 'profile'
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

      {/* Modal de confirmación personalizado */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder."
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        type="danger"
        icon={<FiLogOut className="w-8 h-8" />}
      />

      <Watermark />
    </div>
  )
}