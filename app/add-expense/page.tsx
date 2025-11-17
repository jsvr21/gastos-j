"use client"

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiUpload, FiX, FiFile, FiImage, FiCheck } from 'react-icons/fi'
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

function AddExpenseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fortnightId = searchParams.get('fortnightId') || ''
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // Usar el hook de currency input para el monto
  const amount = useCurrencyInput()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError('')
    setUploadProgress('Subiendo archivos...')

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} excede el tamaño máximo de 10MB`)
        }

        // Validar tipo
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
      setFiles([...files, ...uploadedFiles])
      setUploadProgress(`${uploadedFiles.length} archivo(s) subido(s) correctamente`)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (err: any) {
      console.error('Error uploading files:', err)
      setError(err.message || 'Error al subir archivos')
    } finally {
      setUploading(false)
      // Resetear el input
      e.target.value = ''
    }
  }

  const removeFile = async (index: number) => {
    const fileToRemove = files[index]
    
    try {
      // Eliminar de Cloudinary
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: fileToRemove.publicId,
          resourceType: fileToRemove.resourceType,
        }),
      })

      // Eliminar del estado
      setFiles(files.filter((_, i) => i !== index))
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

    setLoading(true)
    setError('')
    
    try {
      const user = auth.currentUser
      if (!user) {
        setError('Usuario no autenticado')
        router.push('/')
        return
      }

      await addDoc(collection(db, 'expenses'), {
        userId: user.uid,
        fortnightId: fortnightId,
        name: name.trim(),
        amount: amount.numericValue, // Usar el valor numérico
        description: description.trim() || '',
        attachments: files.map(f => ({
          url: f.url,
          publicId: f.publicId,
          format: f.format,
          resourceType: f.resourceType,
          bytes: f.bytes,
          name: f.name,
        })),
        createdAt: new Date(),
      })

      router.back()
    } catch (error: any) {
      console.error('Error adding expense:', error)
      setError('No se pudo agregar el gasto')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
          Agregar Gasto
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
              Comprobantes (Opcional)
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
                  {uploading ? 'Subiendo...' : 'Haz clic para subir archivos'}
                </span>
                <span className="text-sm text-gray-500">
                  PNG, JPG, GIF, PDF (máx. 10MB por archivo)
                </span>
              </label>
            </div>

            {/* Progress Message */}
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

            {/* Lista de Archivos Subidos */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {files.map((file, index) => (
                    <motion.div
                      key={file.publicId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0">
                        {file.resourceType === 'image' ? (
                          <FiImage className="w-6 h-6 text-purple-600" />
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
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : uploading ? 'Subiendo archivos...' : 'Guardar Gasto'}
          </button>
        </motion.form>
      </div>
      <Watermark />
    </div>
  )
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <AddExpenseForm />
    </Suspense>
  )
}