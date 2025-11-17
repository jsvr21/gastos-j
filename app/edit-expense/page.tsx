'use client'

import { useState, FormEvent, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiUpload, FiX, FiFile, FiImage, FiCheck, FiTrash2 } from 'react-icons/fi'
import Watermark from '@/components/Watermark'
import { useCurrencyInput } from '@/lib/hooks/useCurrencyInput'

interface UploadedFile {
  url: string
  publicId: string
  format: string
  resourceType: string
  bytes: number
  name: string
}

interface Expense {
  name: string
  amount: number
  description?: string
  attachments?: UploadedFile[]
}

function EditExpenseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expenseId = searchParams.get('id') || ''
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([])
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([])
  const [filesToDelete, setFilesToDelete] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // Usar el hook de currency input
  const amount = useCurrencyInput()

  useEffect(() => {
    if (expenseId) {
      loadExpense()
    }
  }, [expenseId])

  const loadExpense = async () => {
    try {
      const expenseRef = doc(db, 'expenses', expenseId)
      const expenseDoc = await getDoc(expenseRef)
      
      if (!expenseDoc.exists()) {
        setError('Gasto no encontrado')
        setTimeout(() => router.back(), 2000)
        return
      }

      const expenseData = expenseDoc.data() as Expense
      setName(expenseData.name)
      amount.setValue(expenseData.amount) // Establecer valor con formato
      setDescription(expenseData.description || '')
      setExistingFiles(expenseData.attachments || [])
    } catch (error) {
      console.error('Error loading expense:', error)
      setError('No se pudo cargar el gasto')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError('')
    setUploadProgress('Subiendo archivos...')

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} excede el tamaño máximo de 10MB`)
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
          throw new Error(`El archivo ${file.name} no es un tipo válido`)
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al subir archivo')
        }

        const result = await response.json()
        return {
          ...result,
          name: file.name,
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setNewFiles([...newFiles, ...uploadedFiles])
      setUploadProgress(`${uploadedFiles.length} archivo(s) subido(s) correctamente`)
      
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err: any) {
      console.error('Error uploading files:', err)
      setError(err.message || 'Error al subir archivos')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeExistingFile = async (index: number) => {
    const fileToRemove = existingFiles[index]
    setFilesToDelete([...filesToDelete, JSON.stringify({ 
      publicId: fileToRemove.publicId, 
      resourceType: fileToRemove.resourceType 
    })])
    setExistingFiles(existingFiles.filter((_, i) => i !== index))
  }

  const removeNewFile = async (index: number) => {
    const fileToRemove = newFiles[index]
    
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: fileToRemove.publicId,
          resourceType: fileToRemove.resourceType,
        }),
      })

      setNewFiles(newFiles.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Error removing file:', err)
      setError('Error al eliminar el archivo')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Por favor ingresa un nombre para el gasto')
      return
    }

    if (!amount.numericValue || amount.numericValue <= 0) {
      setError('Por favor ingresa un monto válido')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      // Eliminar archivos marcados de Cloudinary
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map(fileDataString => {
            const fileData = JSON.parse(fileDataString)
            return fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicId: fileData.publicId,
                resourceType: fileData.resourceType,
              }),
            })
          })
        )
      }

      // Combinar archivos existentes que no se eliminaron + archivos nuevos
      const allAttachments = [...existingFiles, ...newFiles]

      await updateDoc(doc(db, 'expenses', expenseId), {
        name: name.trim(),
        amount: amount.numericValue,
        description: description.trim() || '',
        attachments: allAttachments.map(f => ({
          url: f.url,
          publicId: f.publicId,
          format: f.format,
          resourceType: f.resourceType,
          bytes: f.bytes,
          name: f.name,
        })),
        updatedAt: new Date(),
      })

      router.back()
    } catch (error: any) {
      console.error('Error updating expense:', error)
      setError('No se pudo actualizar el gasto')
    } finally {
      setSaving(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const totalFiles = existingFiles.length + newFiles.length

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
              ref={amount.inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              placeholder="Ej: 50.000"
              value={amount.displayValue}
              onChange={amount.handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
            />
            {amount.numericValue > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Valor: ${amount.numericValue.toLocaleString('es-CO')} COP
              </p>
            )}
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

          {/* Sección de Archivos Adjuntos */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Comprobantes (Opcional) {totalFiles > 0 && `- ${totalFiles} archivo(s)`}
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center gap-2 cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FiUpload className="w-8 h-8 text-gray-400" />
                <span className="text-gray-600 font-medium">
                  {uploading ? 'Subiendo...' : 'Agregar más archivos'}
                </span>
                <span className="text-sm text-gray-500">
                  PNG, JPG, GIF, PDF (máx. 10MB por archivo)
                </span>
              </label>
            </div>

            {uploadProgress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg"
              >
                <FiCheck className="w-5 h-5" />
                <span className="text-sm font-medium">{uploadProgress}</span>
              </motion.div>
            )}

            {/* Archivos Existentes */}
            {existingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Archivos actuales:</p>
                {existingFiles.map((file, index) => (
                  <motion.div
                    key={file.publicId}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-shrink-0">
                      {file.resourceType === 'image' ? (
                        <FiImage className="w-6 h-6 text-blue-600" />
                      ) : (
                        <FiFile className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.format.toUpperCase()} • {formatFileSize(file.bytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(index)}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded transition"
                      title="Eliminar archivo"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Archivos Nuevos */}
            {newFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Archivos nuevos:</p>
                {newFiles.map((file, index) => (
                  <motion.div
                    key={file.publicId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-shrink-0">
                      {file.resourceType === 'image' ? (
                        <FiImage className="w-6 h-6 text-green-600" />
                      ) : (
                        <FiFile className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.format.toUpperCase()} • {formatFileSize(file.bytes)} • Nuevo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded transition"
                      title="Eliminar archivo"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : uploading ? 'Subiendo archivos...' : 'Actualizar Gasto'}
          </button>
        </motion.form>
      </div>
      <Watermark />
    </div>
  )
}

export default function EditExpensePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <EditExpenseForm />
    </Suspense>
  )
}