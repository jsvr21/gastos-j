'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, getDoc, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiCheck, FiFilter, FiX } from 'react-icons/fi'
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
  paid?: boolean
}

type FilterStatus = 'all' | 'paid' | 'unpaid'

// Componente que contiene la lógica con useSearchParams
function FortnightContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fortnightId = searchParams.get('id') || ''
  
  const [fortnight, setFortnight] = useState<Fortnight | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  
  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [searchText, setSearchText] = useState('')

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
        let paid = 0

        querySnapshot.forEach((doc) => {
          const expense = { id: doc.id, ...doc.data() } as Expense
          expensesData.push(expense)
          total += expense.amount
          if (expense.paid) {
            paid += expense.amount
          }
        })

        setExpenses(expensesData)
        setTotalSpent(total)
        setTotalPaid(paid)
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
            let paid = 0

            querySnapshot.forEach((doc) => {
              const expense = { id: doc.id, ...doc.data() } as Expense
              expensesData.push(expense)
              total += expense.amount
              if (expense.paid) {
                paid += expense.amount
              }
            })

            // Ordenar manualmente por fecha
            expensesData.sort((a, b) => {
              const aDate = (a as any).createdAt?.toDate?.() || new Date(0)
              const bDate = (b as any).createdAt?.toDate?.() || new Date(0)
              return bDate.getTime() - aDate.getTime()
            })

            setExpenses(expensesData)
            setTotalSpent(total)
            setTotalPaid(paid)
          } catch (fallbackError) {
            console.error('Error cargando gastos:', fallbackError)
            setExpenses([])
            setTotalSpent(0)
            setTotalPaid(0)
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

  const handleTogglePaid = async (expenseId: string, currentPaidStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        paid: !currentPaidStatus,
        paidAt: !currentPaidStatus ? new Date() : null
      })
      loadData()
    } catch (error) {
      alert('No se pudo actualizar el estado del gasto')
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

  const clearFilters = () => {
    setFilterStatus('all')
    setMinAmount('')
    setMaxAmount('')
    setSearchText('')
  }

  const getFilteredExpenses = (): Expense[] => {
    return expenses.filter(expense => {
      // Filtro por estado de pago
      if (filterStatus === 'paid' && !expense.paid) return false
      if (filterStatus === 'unpaid' && expense.paid) return false

      // Filtro por rango de precio
      if (minAmount && expense.amount < parseFloat(minAmount)) return false
      if (maxAmount && expense.amount > parseFloat(maxAmount)) return false

      // Filtro por texto de búsqueda
      if (searchText) {
        const search = searchText.toLowerCase()
        const nameMatch = expense.name.toLowerCase().includes(search)
        const descMatch = expense.description?.toLowerCase().includes(search)
        if (!nameMatch && !descMatch) return false
      }

      return true
    })
  }

  const filteredExpenses = getFilteredExpenses()
  const activeFiltersCount = [
    filterStatus !== 'all',
    minAmount !== '',
    maxAmount !== '',
    searchText !== ''
  ].filter(Boolean).length

  const getRemaining = (): number => {
    if (!fortnight) return 0
    return Math.max(0, fortnight.total - totalSpent)
  }

  const getPending = (): number => {
    return totalSpent - totalPaid
  }

  const getPercentage = (): number => {
    if (!fortnight || fortnight.total === 0) return 0
    return Math.min(100, (totalSpent / fortnight.total) * 100)
  }

  const getPaidPercentage = (): number => {
    if (totalSpent === 0) return 0
    return Math.min(100, (totalPaid / totalSpent) * 100)
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

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <p className="text-gray-500 text-sm mb-2">Total Gastos</p>
            <p className="text-orange-600 text-2xl font-bold">
              ${totalSpent.toLocaleString('es-CO')} COP
            </p>
            <p className="text-gray-400 text-sm mt-1">{getPercentage().toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <p className="text-gray-500 text-sm mb-2">Pagado</p>
            <p className="text-green-600 text-2xl font-bold">
              ${totalPaid.toLocaleString('es-CO')} COP
            </p>
            <p className="text-gray-400 text-sm mt-1">{getPaidPercentage().toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <p className="text-gray-500 text-sm mb-2">Por Pagar</p>
            <p className="text-red-600 text-2xl font-bold">
              ${getPending().toLocaleString('es-CO')} COP
            </p>
            <p className="text-gray-400 text-sm mt-1">Pendiente</p>
          </motion.div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Gastos</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredExpenses.length} de {expenses.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push(`/add-expense?fortnightId=${fortnightId}`)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FiFilter className="w-5 h-5 text-purple-600" />
                    Filtrar Gastos
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      <FiX className="w-4 h-4" />
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Filtro por estado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                          filterStatus === 'all'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilterStatus('paid')}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                          filterStatus === 'paid'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Pagados
                      </button>
                      <button
                        onClick={() => setFilterStatus('unpaid')}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                          filterStatus === 'unpaid'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Sin Pagar
                      </button>
                    </div>
                  </div>

                  {/* Búsqueda por texto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Buscar por nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Rango de precio mínimo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monto Mínimo (COP)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 10000"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Rango de precio máximo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monto Máximo (COP)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 500000"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl shadow-sm"
          >
            <p className="text-gray-600">
              {expenses.length === 0 
                ? 'No hay gastos registrados' 
                : 'No se encontraron gastos con los filtros aplicados'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-purple-600 hover:text-purple-700 font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border-2 ${
                  expense.paid ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleTogglePaid(expense.id, expense.paid || false)}
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        expense.paid
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400 text-transparent hover:text-gray-400'
                      }`}
                      title={expense.paid ? 'Marcar como no pagado' : 'Marcar como pagado'}
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-1 ${
                        expense.paid ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}>
                        {expense.name}
                      </h3>
                      {expense.description && (
                        <p className="text-gray-500 text-sm mb-2">{expense.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-lg ${
                          expense.paid ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          ${expense.amount.toLocaleString('es-CO')} COP
                        </p>
                        {expense.paid ? (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                            Pagado
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                            Sin Pagar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/edit-expense?id=${expense.id}&name=${encodeURIComponent(expense.name)}&amount=${expense.amount}&description=${encodeURIComponent(expense.description || '')}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
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