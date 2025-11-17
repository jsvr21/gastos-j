import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  icon?: React.ReactNode
  showCancel?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  icon,
  showCancel = true
}: ConfirmModalProps) {
  
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'from-red-500 to-red-600',
          icon: 'bg-red-100 text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
          defaultIcon: <FiAlertCircle className="w-8 h-8" />
        }
      case 'warning':
        return {
          bg: 'from-orange-500 to-orange-600',
          icon: 'bg-orange-100 text-orange-600',
          button: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
          defaultIcon: <FiAlertCircle className="w-8 h-8" />
        }
      case 'success':
        return {
          bg: 'from-green-500 to-green-600',
          icon: 'bg-green-100 text-green-600',
          button: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
          defaultIcon: <FiCheckCircle className="w-8 h-8" />
        }
      case 'info':
        return {
          bg: 'from-blue-500 to-blue-600',
          icon: 'bg-blue-100 text-blue-600',
          button: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
          defaultIcon: <FiInfo className="w-8 h-8" />
        }
    }
  }

  const colors = getColors()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto"
            >
              {/* Header con gradiente */}
              <div className={`bg-gradient-to-r ${colors.bg} p-6 relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col items-center text-center">
                  {/* Icono animado */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", damping: 15 }}
                    className={`w-16 h-16 ${colors.icon} rounded-full flex items-center justify-center mb-4`}
                  >
                    {icon || colors.defaultIcon}
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white">
                    {title}
                  </h2>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <p className="text-gray-600 text-center mb-6">
                  {message}
                </p>

                {/* Botones */}
                <div className={`flex gap-3 ${!showCancel ? 'justify-center' : ''}`}>
                  {showCancel && (
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                      {cancelText}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`${showCancel ? 'flex-1' : 'px-8'} px-4 py-3 ${colors.button} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>

              {/* Marca de agua sutil */}
              <div className="px-6 pb-4 text-center">
                <p className="text-gray-300 text-xs">JormanDEV</p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}