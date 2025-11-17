import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Hook para manejar inputs de moneda con formato automático
 * Formatea mientras escribes: 1234567 → 1.234.567
 * Mantiene la posición del cursor correctamente
 * 
 * @param initialValue - Valor inicial (opcional)
 * @returns Objeto con displayValue, numericValue, handleChange, inputRef
 * 
 * @example
 * const amount = useCurrencyInput()
 * 
 * <input
 *   ref={amount.inputRef}
 *   value={amount.displayValue}
 *   onChange={amount.handleChange}
 * />
 * 
 * // Para guardar:
 * const valueToSave = amount.numericValue
 */
export function useCurrencyInput(initialValue: string = '') {
  const [displayValue, setDisplayValue] = useState(() => {
    const cleaned = initialValue.replace(/\D/g, '')
    return cleaned ? formatNumber(cleaned) : ''
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorPositionRef = useRef<number | null>(null)

  // Formatear número con puntos de miles
  function formatNumber(value: string): string {
    if (!value) return ''
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Obtener el valor numérico limpio
  const getNumericValue = useCallback((): number => {
    const cleaned = displayValue.replace(/\D/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }, [displayValue])

  // Calcular nueva posición del cursor después del formato
  function calculateCursorPosition(
    oldValue: string,
    newValue: string,
    oldCursorPos: number
  ): number {
    const dotsBeforeCursorOld = (oldValue.slice(0, oldCursorPos).match(/\./g) || []).length
    const positionWithoutDots = oldCursorPos - dotsBeforeCursorOld
    
    let newPosition = 0
    let digitsCount = 0
    
    for (let i = 0; i < newValue.length; i++) {
      if (newValue[i] !== '.') {
        digitsCount++
        if (digitsCount >= positionWithoutDots) {
          newPosition = i + 1
          break
        }
      }
    }
    
    if (newPosition === 0) {
      newPosition = newValue.length
    }
    
    return newPosition
  }

  // Manejar cambio en el input
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const cursorPosition = input.selectionStart || 0
    const oldValue = displayValue
    let newValue = input.value

    // Solo permitir dígitos y puntos
    newValue = newValue.replace(/[^\d.]/g, '')
    
    // Remover todos los puntos
    const cleaned = newValue.replace(/\./g, '')
    
    // Si está vacío, limpiar
    if (!cleaned) {
      setDisplayValue('')
      return
    }

    // Limitar a 12 dígitos (999.999.999.999)
    const limited = cleaned.slice(0, 12)
    
    // Formatear con puntos
    const formatted = formatNumber(limited)
    
    // Calcular y guardar nueva posición del cursor
    cursorPositionRef.current = calculateCursorPosition(
      oldValue,
      formatted,
      cursorPosition
    )
    
    setDisplayValue(formatted)
  }, [displayValue])

  // Restaurar posición del cursor después del re-render
  useEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null) {
      inputRef.current.setSelectionRange(
        cursorPositionRef.current,
        cursorPositionRef.current
      )
      cursorPositionRef.current = null
    }
  }, [displayValue])

  // Función para limpiar el input
  const clear = useCallback(() => {
    setDisplayValue('')
  }, [])

  // Función para establecer un valor programáticamente
  const setValue = useCallback((value: string | number) => {
    const cleaned = value.toString().replace(/\D/g, '')
    setDisplayValue(cleaned ? formatNumber(cleaned) : '')
  }, [])

  return {
    displayValue,        // Valor formateado para mostrar
    numericValue: getNumericValue(), // Valor numérico limpio
    handleChange,        // Handler para onChange
    inputRef,           // Ref para el input
    clear,              // Función para limpiar
    setValue,           // Función para establecer valor
  }
}