'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

// Componente que contiene la lógica con useSearchParams
function EditExpenseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expenseId = searchParams.get('id') || ''
  const nameParam = searchParams.get('name') || ''
  const amountParam = searchParams.get('amount') || ''
  const descriptionParam = searchParams.get('description') || ''
  
  const [name, setName] = useState(decodeURIComponent(nameParam))
  const [amount, setAmount] = useState(amountParam)
  const [description, setDescription] = useState(decodeURIComponent(descriptionParam))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amountValue = parseFloat(amount.replace(/[^0-9.-]+/g, ''))

    if (!name.trim()) {
      setError('Por favor ingresa un nombre para el gasto')
      return
    }

    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Por favor ingresa un monto válido')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        name: name.trim(),
        amount: amountValue,
        description: description.trim() || '',
        updatedAt: new Date(),
      })

      router.back()
    } catch (error: any) {
      console.error('Error updating expense:', error)
      setError('No se pudo actualizar el gasto')
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
          Editar Gasto
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nombre del Gasto *
            </label>
            <input
              type="text"
              placeholder="Ej: Comida, Transporte, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Monto (COP) *
            </label>
            <input
              type="text"
              placeholder="Ej: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              placeholder="Agrega una descripción adicional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none text-gray-900 placeholder:text-gray-400"
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
            {loading ? 'Guardando...' : 'Actualizar Gasto'}
          </button>
        </motion.form>
      </div>
      <Watermark />
    </div>
  )
}

// Componente principal que exportas
export default function EditExpensePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <EditExpenseForm />
    </Suspense>
  )
}