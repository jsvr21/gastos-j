'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiPlus, FiRefreshCw } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

interface Fortnight {
  id: string
  year: number
  month: number
  day: number
  total: number
}

export default function MonthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const year = parseInt(searchParams.get('year') || '0')
  const month = parseInt(searchParams.get('month') || '0')
  
  const [fortnights, setFortnights] = useState<Fortnight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (year && month) {
      loadFortnights()
    }
  }, [year, month])

  // Recargar cuando la página vuelve a estar visible
  useEffect(() => {
    const handleFocus = () => {
      if (year && month) {
        loadFortnights()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [year, month])

  const loadFortnights = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      setLoading(true)

      try {
        // Consulta simple sin orderBy para evitar problemas de índices
        const fortnightsRef = collection(db, 'fortnights')
        const q = query(
          fortnightsRef,
          where('userId', '==', user.uid),
          where('year', '==', year),
          where('month', '==', month)
        )

        const querySnapshot = await getDocs(q)
        const fortnightsData: Fortnight[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fortnightsData.push({ 
            id: doc.id, 
            year: data.year,
            month: data.month,
            day: data.day,
            total: data.total
          } as Fortnight)
        })

        // Ordenar manualmente por día
        fortnightsData.sort((a, b) => a.day - b.day)

        console.log('Quincenas cargadas:', fortnightsData.length)
        setFortnights(fortnightsData)
      } catch (queryError: any) {
        console.error('Error en consulta:', queryError)
        // Si hay error, intentar consulta más simple
        if (queryError.code === 'failed-precondition' || queryError.code === 'permission-denied') {
          try {
            // Consulta solo por userId y filtrar en memoria
            const fortnightsRef = collection(db, 'fortnights')
            const q = query(
              fortnightsRef,
              where('userId', '==', user.uid)
            )

            const querySnapshot = await getDocs(q)
            const fortnightsData: Fortnight[] = []

            querySnapshot.forEach((doc) => {
              const data = doc.data()
              // Filtrar por año y mes en memoria
              if (data.year === year && data.month === month) {
                fortnightsData.push({ 
                  id: doc.id, 
                  year: data.year,
                  month: data.month,
                  day: data.day,
                  total: data.total
                } as Fortnight)
              }
            })

            // Ordenar manualmente por día
            fortnightsData.sort((a, b) => a.day - b.day)

            console.log('Quincenas cargadas (filtrado en memoria):', fortnightsData.length)
            setFortnights(fortnightsData)
          } catch (fallbackError) {
            console.error('Error en consulta alternativa:', fallbackError)
            setFortnights([])
          }
        } else {
          setFortnights([])
        }
      }
    } catch (error) {
      console.error('Error loading fortnights:', error)
      setFortnights([])
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[month - 1] || ''
  }

  const getFortnightLabel = (day: number): string => {
    return day === 15 ? 'Primera Quincena (1-15)' : 'Segunda Quincena (16-30)'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 transition"
        >
          <FiArrowLeft className="w-5 h-5" />
          Atrás
        </motion.button>

        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-800"
          >
            {getMonthName()} {year}
          </motion.h1>
          <button
            onClick={() => {
              setLoading(true)
              loadFortnights()
            }}
            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
            title="Recargar"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : fortnights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm mb-6"
          >
            <p className="text-gray-600 text-lg mb-4">No hay quincenas registradas</p>
            <button
              onClick={() => router.push(`/add-fortnight?year=${year}&month=${month}`)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Agregar Quincena
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 mb-6">
            {fortnights.map((fortnight, index) => (
              <motion.div
                key={fortnight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/fortnight?id=${fortnight.id}&year=${year}&month=${month}&day=${fortnight.day}`)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-purple-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {getFortnightLabel(fortnight.day)}
                    </h3>
                    <p className="text-purple-600 font-semibold mt-1">
                      ${fortnight.total.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                  <span className="text-purple-600 text-2xl">→</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => router.push(`/add-fortnight?year=${year}&month=${month}`)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Agregar Nueva Quincena
        </motion.button>
      </div>
      <Watermark />
    </div>
  )
}

