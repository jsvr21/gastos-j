'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

export default function AddFortnightPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDate = new Date()
  
  const [year, setYear] = useState(parseInt(searchParams.get('year') || currentDate.getFullYear().toString()))
  const [month, setMonth] = useState(parseInt(searchParams.get('month') || (currentDate.getMonth() + 1).toString()))
  const [total, setTotal] = useState('')
  const [selectedDay, setSelectedDay] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const totalAmount = parseFloat(total.replace(/[^0-9.-]+/g, ''))

    if (!total || isNaN(totalAmount) || totalAmount <= 0) {
      setError('Por favor ingresa un monto válido')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const user = auth.currentUser
      console.log('Usuario actual:', user)
      console.log('User UID:', user?.uid)
      console.log('User email:', user?.email)
      
      if (!user) {
        setError('Usuario no autenticado. Por favor inicia sesión nuevamente.')
        router.push('/')
        return
      }
      
      // Verificar que el token de autenticación sea válido
      try {
        const token = await user.getIdToken()
        console.log('Token obtenido:', token ? 'Sí' : 'No')
      } catch (tokenError) {
        console.error('Error obteniendo token:', tokenError)
        setError('Error de autenticación. Por favor inicia sesión nuevamente.')
        router.push('/')
        return
      }

      // Verificar que db esté inicializado
      if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
        setError('Error: Firestore no está inicializado. Recarga la página.')
        setLoading(false)
        return
      }

      console.log('Intentando crear quincena con datos:', {
        userId: user.uid,
        year,
        month,
        day: selectedDay,
        total: totalAmount
      })

      // Verificar si ya existe una quincena para este día
      try {
        const fortnightsRef = collection(db, 'fortnights')
        const q = query(
          fortnightsRef,
          where('userId', '==', user.uid),
          where('year', '==', year),
          where('month', '==', month),
          where('day', '==', selectedDay)
        )

        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          setError(`Ya existe una quincena registrada para el día ${selectedDay} de este mes`)
          setLoading(false)
          return
        }
      } catch (queryError: any) {
        console.warn('Error verificando quincena existente (continuando):', queryError)
        // Continuamos aunque falle la verificación
      }

      // Crear la quincena
      const docData = {
        userId: user.uid,
        year: year,
        month: month,
        day: selectedDay,
        total: totalAmount,
        createdAt: new Date(),
      }
      
      console.log('Datos a guardar:', docData)
      
      const docRef = await addDoc(collection(db, 'fortnights'), docData)
      console.log('Quincena creada exitosamente con ID:', docRef.id)

      // Redirigir al mes correspondiente para ver la quincena creada
      router.push(`/month?year=${year}&month=${month}`)
    } catch (error: any) {
      console.error('Error adding fortnight:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      if (error.code === 'permission-denied') {
        setError('Error de permisos. Verifica que las reglas de Firestore estén configuradas correctamente.')
      } else if (error.code === 'unauthenticated') {
        setError('No estás autenticado. Por favor inicia sesión nuevamente.')
        router.push('/')
      } else {
        setError(`Error: ${error.message || 'No se pudo agregar la quincena'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 transition"
        >
          <FiArrowLeft className="w-5 h-5" />
          Cancelar
        </motion.button>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 mb-8"
        >
          Agregar Quincena
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Año *
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const y = currentDate.getFullYear() - 2 + i
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Mes *
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
            >
              {[
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ].map((monthName, index) => (
                <option key={index + 1} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Selecciona la Quincena *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedDay(15)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedDay === 15
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                Primera (1-15)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay(30)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedDay === 30
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                Segunda (16-30)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Total de la Quincena (COP) *
            </label>
            <input
              type="text"
              placeholder="Ej: 1000000"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Quincena'}
          </button>
        </motion.form>
      </div>
      <Watermark />
    </div>
  )
}

