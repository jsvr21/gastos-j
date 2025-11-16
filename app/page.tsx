'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Cargar LoginPage dinámicamente para evitar problemas de SSR
const LoginPage = dynamic(() => import('./login/page'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Solo verificar autenticación en el cliente
    if (typeof window !== 'undefined') {
      import('@/lib/firebase/config').then(({ auth }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              router.push('/home')
            }
          })
          return () => unsubscribe()
        })
      })
    }
  }, [router])

  if (!mounted) {
    return null
  }

  return <LoginPage />
}

