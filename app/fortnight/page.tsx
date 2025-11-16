'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, getDoc, orderBy, doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Watermark from '@/components/Watermark'

interface Fortnight {
  id: string
  total: number
}

interface Expense {
  id: string
  name: string
  amount: number
  description?: string
}

// Componente que contiene la lógica con useSearchParams
function FortnightContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fortnightId = searchParams.get('id') || ''
  
  const [fortnight, setFortnight] = useState<Fortnight | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    if (fortnightId) {
      loadData()
    }
  }, [fortnightId])

  const loadData = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      // Cargar quincena
      const fortnightRef = doc(db, 'fortnights', fortnightId)
      const fortnightDoc = await getDoc(fortnightRef)
      
      if (!fortnightDoc.exists()) {
        alert('Quincena no encontrada')
        router.back()
        return
      }

      const fortnightData = { id: fortnightDoc.id, ...fortnightDoc.data() } as Fortnight
      setFortnight(fortnightData)

      // Cargar gastos
      try {
        const expensesRef = collection(db, 'expenses')
        const q = query(
          expensesRef,
          where('userId', '==', user.uid),
          where('fortnightId', '==', fortnightId),
          orderBy('createdAt', 'desc')
        )

        const querySnapshot = await getDocs(q)
        const expensesData: Expense[] = []
        let total = 0

        querySnapshot.forEach((doc) => {
          const expense = { id: doc.id, ...doc.data() } as Expense
          expensesData.push(expense)
          total += expense.amount
        })

        setExpenses(expensesData)
        setTotalSpent(total)
      } catch (expenseError: any) {
        // Si hay error de índice, intentar sin orderBy
        if (expenseError.code === 'failed-precondition') {
          try {
            const expensesRef = collection(db, 'expenses')
            const q = query(
              expensesRef,
              where('userId', '==', user.uid),
              where('fortnightId', '==', fortnightId)
            )

            const querySnapshot = await getDocs(q)
            const expensesData: Expense[] = []
            let total = 0

            querySnapshot.forEach((doc) => {
              const expense = { id: doc.id, ...doc.data() } as Expense
              expensesData.push(expense)
              total += expense.amount
            })

            // Ordenar manualmente por fecha
            expensesData.sort((a, b) => {
              const aDate = (a as any).createdAt?.toDate?.() || new Date(0)
              const bDate = (b as any).createdAt?.toDate?.() || new Date(0)
              return bDate.getTime() - aDate.getTime()
            })

            setExpenses(expensesData)
            setTotalSpent(total)
          } catch (fallbackError) {
            console.error('Error cargando gastos:', fallbackError)
            setExpenses([])
            setTotalSpent(0)
          }
        } else {
          throw expenseError
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'expenses', expenseId))
      loadData()
    } catch (error) {
      alert('No se pudo eliminar el gasto')
    }
  }

  const getRemaining = (): number => {
    if (!fortnight) return 0
    return Math.max(0, fortnight.total - totalSpent)
  }

  const getPercentage = (): number => {
    if (!fortnight || fortnight.total === 0) return 0
    return Math.min(100, (totalSpent / fortnight.total) * 100)
  }

  const getRemainingPercentage = (): number => {
    if (!fortnight || fortnight.total === 0) return 0
    return Math.max(0, (getRemaining() / fortnight.total) * 100)
  }

  if (loading || !fortnight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-6 shadow-xl"
        >
          <h2 className="text-white/90 text-sm font-semibold mb-2">Total Quincena</h2>
          <p className="text-white text-4xl font-bold mb-4">
            ${fortnight.total.toLocaleString('es-CO')} COP
          </p>
          <button
            onClick={() => router.push(`/edit-fortnight?id=${fortnight.id}&total=${fortnight.total}`)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            <FiEdit2 className="w-4 h-4 inline mr-2" />
            Editar Total
          </button>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <p className="text-gray-500 text-sm mb-2">Gastado</p>
            <p className="text-red-600 text-2xl font-bold">
              ${totalSpent.toLocaleString('es-CO')} COP
            </p>
            <p className="text-gray-400 text-sm mt-1">{getPercentage().toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <p className="text-gray-500 text-sm mb-2">Restante</p>
            <p className="text-green-600 text-2xl font-bold">
              ${getRemaining().toLocaleString('es-CO')} COP
            </p>
            <p className="text-gray-400 text-sm mt-1">{getRemainingPercentage().toFixed(1)}%</p>
          </motion.div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gastos</h2>
          <button
            onClick={() => router.push(`/add-expense?fortnightId=${fortnightId}`)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {expenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <p className="text-gray-600">No hay gastos registrados</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {expenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {expense.name}
                    </h3>
                    {expense.description && (
                      <p className="text-gray-500 text-sm mb-2">{expense.description}</p>
                    )}
                    <p className="text-purple-600 font-bold text-lg">
                      ${expense.amount.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/edit-expense?id=${expense.id}&name=${encodeURIComponent(expense.name)}&amount=${expense.amount}&description=${encodeURIComponent(expense.description || '')}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Watermark />
    </div>
  )
}

// Componente principal que exportas
export default function FortnightPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <FortnightContent />
    </Suspense>
  )
}