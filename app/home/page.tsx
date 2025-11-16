'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiPlus, FiLogOut, FiCalendar } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

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

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      signOut(auth)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Hola, {userName}
            </h1>
            <p className="text-gray-600 mt-1">Gestiona tus gastos quincenales</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold transition"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleAddMonth}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl mb-6 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Agregar Quincena
        </motion.button>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Seleccionar Año
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
          >
            {getAvailableYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Meses de {selectedYear}</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando...</p>
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
                  className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border ${
                    isCurrentMonth 
                      ? 'border-purple-300 hover:border-purple-400 bg-purple-50/30' 
                      : isPastMonth
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-800">{month.monthName}</h3>
                        {isCurrentMonth && (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-purple-600 text-2xl">→</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <Watermark />
    </div>
  )
}

