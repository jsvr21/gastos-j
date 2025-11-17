'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiDownload, FiFile, FiImage, FiX, FiExternalLink, FiAlertTriangle } from 'react-icons/fi'
import Watermark from '@/components/Watermark'
import ConfirmModal from '@/components/ConfirmModal'
import Image from 'next/image'

interface Attachment {
  url: string
  publicId: string
  format: string
  resourceType: string
  bytes: number
  name: string
}

interface Expense {
  id: string
  name: string
  amount: number
  description?: string
  paid?: boolean
  attachments?: Attachment[]
  createdAt: any
}

function ExpenseDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expenseId = searchParams.get('id') || ''
  
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (expenseId) {
      loadExpense()
    }
  }, [expenseId])

  const loadExpense = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      const expenseRef = doc(db, 'expenses', expenseId)
      const expenseDoc = await getDoc(expenseRef)
      
      if (!expenseDoc.exists()) {
        setErrorMessage('Gasto no encontrado')
        setShowErrorModal(true)
        setTimeout(() => router.back(), 2000)
        return
      }

      const expenseData = { id: expenseDoc.id, ...expenseDoc.data() } as Expense
      setExpense(expenseData)
    } catch (error) {
      console.error('Error loading expense:', error)
      setErrorMessage('No se pudieron cargar los datos')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
      setErrorMessage('Error al descargar el archivo')
      setShowErrorModal(true)
    }
  }

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading || !expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          Volver
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{expense.name}</h1>
              {expense.description && (
                <p className="text-gray-600">{expense.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Monto</p>
              <p className="text-3xl font-bold text-purple-600">
                ${expense.amount.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estado:</span>
              {expense.paid ? (
                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                  Pagado
                </span>
              ) : (
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                  Sin Pagar
                </span>
              )}
            </div>
            {expense.createdAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Fecha:</span>
                <span className="text-sm text-gray-700 font-medium">
                  {new Date(expense.createdAt.toDate()).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {expense.attachments && expense.attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Comprobantes ({expense.attachments.length})
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {expense.attachments.map((attachment, index) => (
                <motion.div
                  key={attachment.publicId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {attachment.resourceType === 'image' ? (
                    <div className="relative">
                      <div 
                        className="relative w-full h-48 bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedImage(attachment.url)}
                      >
                        <Image
                          src={attachment.url}
                          alt={attachment.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FiImage className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {attachment.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {attachment.format.toUpperCase()} • {formatFileSize(attachment.bytes)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadFile(attachment.url, attachment.name)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Descargar"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openInNewTab(attachment.url)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Abrir en nueva pestaña"
                            >
                              <FiExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiFile className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate mb-1">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.format.toUpperCase()} • {formatFileSize(attachment.bytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(attachment.url, attachment.name)}
                          className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                        >
                          <FiDownload className="w-4 h-4" />
                          Descargar
                        </button>
                        <button
                          onClick={() => openInNewTab(attachment.url)}
                          className="flex-1 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                        >
                          <FiExternalLink className="w-4 h-4" />
                          Ver
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {(!expense.attachments || expense.attachments.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <FiFile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              Este gasto no tiene comprobantes adjuntos
            </p>
          </motion.div>
        )}
      </div>

      {/* Modal de visualización de imagen */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              <FiX className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Vista ampliada"
                width={1200}
                height={800}
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        confirmText="Entendido"
        type="warning"
        icon={<FiAlertTriangle className="w-8 h-8" />}
        showCancel={false}
      />

      <Watermark />
    </div>
  )
}

export default function ExpenseDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ExpenseDetailsContent />
    </Suspense>
  )
}