'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import Watermark from '@/components/Watermark'
import { useCurrencyInput } from '@/lib/hooks/useCurrencyInput'

// Componente que contiene la lógica con useSearchParams
function EditFortnightForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fortnightId = searchParams.get('id') || ''
  const currentTotal = searchParams.get('total') || ''
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Usar el hook de currency input con valor inicial
  const total = useCurrencyInput(currentTotal)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!total.numericValue || total.numericValue <= 0) {
      setError('Por favor ingresa un monto válido')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await updateDoc(doc(db, 'fortnights', fortnightId), {
        total: total.numericValue,
        updatedAt: new Date(),
      })

      router.back()
    } catch (error: any) {
      console.error('Error updating fortnight:', error)
      setError('No se pudo actualizar el total de la quincena')
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
          Editar Total de Quincena
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nuevo Total de la Quincena (COP) *
            </label>
            <input
              ref={total.inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              placeholder="Ej: 1.000.000"
              value={total.displayValue}
              onChange={total.handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-lg text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            {total.numericValue > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Valor: ${total.numericValue.toLocaleString('es-CO')} COP
              </p>
            )}
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
            {loading ? 'Guardando...' : 'Actualizar Total'}
          </button>
        </motion.form>
      </div>
      <Watermark />
    </div>
  )
}

// Componente principal que exportas
export default function EditFortnightPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <EditFortnightForm />
    </Suspense>
  )
}