'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type HorarioItem = {
  Dia_Semana: string
  Hora_Entrada_Esperada: string
  Hora_Salida_Esperada: string
}

export default function VistaDocentePage() {
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('')
  const [horario, setHorario] = useState<HorarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const nombreUsuario = datosUsuario.nombre || 'Usuario'
    setNombre(nombreUsuario)
    setRol(datosUsuario.rol || 'Personal Académico')

    const obtenerHorario = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/horario?usuario=${nombreUsuario}`)
        if (!response.ok) throw new Error('Error al obtener horario')
        const json = await response.json()

        if (json.success) {
          setHorario(json.data) // Aquí asignamos el array correcto
        } else {
          setHorario([])
          setError('No se encontró horario para este usuario')
        }
      } catch (error) {
        setHorario([])
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    obtenerHorario()
  }, [])

  const irAsistencia = () => {
    router.push('/asistencia')
  }

  const irReporte = () => {
    router.push('/reporte')
  }

  const cerrarSesion = () => {
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-10 flex flex-col items-center">
      <img src="/logo.png" alt="Logo del sistema" className="mx-auto mb-5 w-60 h-auto" />

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#0a2e63]">Bienvenido, {nombre}</h1>
          <p className="text-lg text-[#1c3f74] mt-1">Rol: {rol}</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={irAsistencia}
            className="w-full bg-[#0a2e63] hover:bg-[#092750] text-white py-3 rounded-xl font-semibold transition"
          >
            Registrar / Justificar Asistencia
          </button>

          <button
            onClick={irReporte}
            className="w-full bg-[#0a2e63] hover:bg-[#092750] text-white py-3 rounded-xl font-semibold transition"
          >
            Consultar Reporte
          </button>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-[#0a2e63] mb-4 text-center">Mi Horario</h2>

          {loading ? (
            <p className="text-center text-gray-500">Cargando horario...</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : horario.length === 0 ? (
            <p className="text-center text-gray-500">No hay horario asignado.</p>
          ) : (
            <table className="w-full text-left border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-[#0a2e63] text-white">
                <tr>
                  <th className="p-3">Día</th>
                  <th className="p-3">Hora Entrada</th>
                  <th className="p-3">Hora Salida</th>
                </tr>
              </thead>
              <tbody>
                {horario.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                    <td className="p-3">{item.Dia_Semana}</td>
                    <td className="p-3">{item.Hora_Entrada_Esperada}</td>
                    <td className="p-3">{item.Hora_Salida_Esperada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={cerrarSesion}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-xl font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
