'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AsistenciaExpressPage() {
  const searchParams = useSearchParams()
  const [tipo, setTipo] = useState('')
  const [nombre, setNombre] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    setTipo(searchParams.get('tipo') || '')
    setNombre(searchParams.get('nombre') || '')
    setMensaje(searchParams.get('mensaje') || '')

    const timeout = setTimeout(() => {
      window.close()
    }, 5000)

    return () => clearTimeout(timeout)
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">
          {tipo === 'entrada' ? '✅ Entrada Registrada' : '✅ Salida Registrada'}
        </h1>
        <p className="text-lg text-gray-800 mb-4">¡Hola {nombre}!</p>
        <p className="text-md text-gray-600">{mensaje}</p>
        <p className="mt-6 text-sm text-gray-400">Esta pantalla se cerrará automáticamente.</p>
      </div>
    </div>
  )
}
