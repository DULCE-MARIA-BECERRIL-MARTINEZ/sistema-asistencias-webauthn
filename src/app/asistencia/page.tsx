'use client'
import React, { useEffect, useState } from 'react'

interface HistorialItem {
  fecha: string
  entrada: string | null
  salida: string | null
  estado?: string
  asunto?: string | null
  status?: string
  evidencia?: string | null
}

interface HorarioItem {
  id: number
  entrada: string
  salida: string
}

export default function VistaAsistencia() {
  const [isClient, setIsClient] = useState(false)
  const [nombre, setNombre] = useState<string>('')
  const [rol, setRol] = useState<string>('')
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [horarios, setHorarios] = useState<HorarioItem[]>([])
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [asunto, setAsunto] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const datosUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_personal = datosUsuario.id
    setNombre(datosUsuario.nombre || 'Usuario')
    setRol(datosUsuario.rol || 'Personal Académico')

    if (id_personal) {
      fetchHistorial(id_personal)
      fetchHorarios(id_personal)
    } else {
      setError('No se pudo obtener el ID del usuario.')
      setLoading(false)
    }
  }, [isClient])

  async function fetchHorarios(id_personal: number) {
    const diaActual = new Date().toLocaleDateString('es-MX', { weekday: 'long' }).toLowerCase()
    const res = await fetch(`/api/horario?dia=${diaActual}&id=${id_personal}`)
    const data = await res.json()
    if (data.success) {
      setHorarios(data.data.map((h: any) => ({
        id: h.ID_Horario,
        entrada: h.Hora_Entrada_Esperada,
        salida: h.Hora_Salida_Esperada
      })))
    }
  }

  async function fetchHistorial(id_personal: string | number) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/asistencia/historial?id_personal=${id_personal}`)
      if (!res.ok) throw new Error('Error al cargar historial')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const historialNormalizado: HistorialItem[] = data.data
          .filter((item: any) => item.Estado !== 'Eliminado')
          .map((item: any) => ({
            fecha: item.Fecha ? new Date(item.Fecha).toLocaleDateString('es-MX') : '-',
            entrada: item.Hora_Entrada ? new Date(item.Hora_Entrada).toLocaleTimeString('es-MX') : null,
            salida: item.Hora_Salida ? new Date(item.Hora_Salida).toLocaleTimeString('es-MX') : null,
            estado: item.Estado,
            asunto: item.Asunto,
            status: item.Status,
            evidencia: item.Evidencia
          }))
        setHistorial(historialNormalizado.reverse())
      } else {
        setHistorial([])
        setError('No se encontró historial')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function registrar(tipo: string) {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_personal = datosUsuario.id
    if (!id_personal) return alert('Usuario no identificado')

    if (tipo === 'justificar') {
      if (!bloqueSeleccionado) return alert('Debes seleccionar un bloque horario para justificar.')
      setMostrarModal(true)
      return
    }

    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: tipo, ID_Personal: id_personal }),
      })
      const data = await res.json()
      alert(data.message || 'Error al registrar')
      await fetchHistorial(id_personal)
    } catch {
      alert('Error de conexión')
    }
  }

  const enviarJustificacion = async () => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_personal = datosUsuario.id
    if (!asunto || !archivo) return alert('Debes proporcionar motivo y archivo.')

    const [horaEntradaEsperada, horaSalidaEsperada] = bloqueSeleccionado.split('|')
    const reader = new FileReader()
    reader.onload = async () => {
      const evidenciaBase64 = reader.result as string
      try {
        const res = await fetch('/api/asistencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accion: 'justificar',
            ID_Personal: id_personal,
            asunto,
            evidencia: evidenciaBase64,
            horaEntradaEsperada,
            horaSalidaEsperada
          }),
        })
        const data = await res.json()
        alert(data.message || 'Error al registrar')
        await fetchHistorial(id_personal)
      } catch {
        alert('Error de conexión')
      } finally {
        setMostrarModal(false)
        setArchivo(null)
        setAsunto('')
        setBloqueSeleccionado('')
      }
    }
    reader.readAsDataURL(archivo)
  }

  if (!isClient) return null

  return (
    <main className="min-h-screen bg-white text-gray-800 px-6 py-10 font-sans">
      <img src="/logo.png" alt="Logo del sistema" className="mx-auto mb-6 w-60 h-auto" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-900">Registro de Asistencia</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona bloque a justificar:</label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={bloqueSeleccionado}
            onChange={(e) => setBloqueSeleccionado(e.target.value)}
          >
            <option value="">-- Selecciona un bloque --</option>
            {horarios.map((h, i) => (
              <option key={i} value={`${h.entrada}|${h.salida}`}>
                {h.entrada} - {h.salida}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => registrar('entrada')}
            className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300"
          >
            Registrar Entrada
          </button>
          <button
            onClick={() => registrar('salida')}
            className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300"
          >
            Registrar Salida
          </button>
          <button
            onClick={() => registrar('justificar')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300"
          >
            Justificar Inasistencia
          </button>
        </div>

        <div className="bg-gray-100 p-6 rounded-xl shadow-inner">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Historial Reciente</h2>
          {loading ? (
            <p>Cargando historial...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : historial.length === 0 ? (
            <p>No hay registros disponibles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-600 uppercase bg-gray-200">
                  <tr>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Hora de Entrada</th>
                    <th className="px-4 py-2">Hora de Salida</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Justificación</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(({ fecha, entrada, salida, estado, asunto, evidencia }, i) => (
                    <tr key={i} className="bg-white border-b">
                      <td className="px-4 py-2">{fecha}</td>
                      <td className="px-4 py-2">{entrada || '-'}</td>
                      <td className="px-4 py-2">{salida || '-'}</td>
                      <td
                        className={`px-4 py-2 font-semibold ${
                          estado?.toLowerCase().includes('salida')
                            ? 'text-green-600'
                            : estado?.toLowerCase().includes('entrada')
                            ? 'text-blue-600'
                            : estado?.toLowerCase().includes('justificación')
                            ? 'text-yellow-600'
                            : estado?.toLowerCase().includes('presente')
                            ? 'text-indigo-600'
                            : estado?.toLowerCase().includes('ausente')
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {estado || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {asunto || '-'}
                        {evidencia && (
                          <a
                            href={`/evidencias/${evidencia}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline block text-sm mt-1"
                          >
                            Ver evidencia
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Justificar Inasistencia</h2>
            <label className="block mb-2 text-sm font-medium text-gray-700">Motivo:</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full border px-3 py-2 mb-4 rounded-lg focus:outline-none focus:ring"
              placeholder="Escribe el motivo"
            />
            <label className="block mb-2 text-sm font-medium text-gray-700">Evidencia (imagen o PDF):</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 bg-gray-400 rounded-lg text-white hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={enviarJustificacion}
                className="px-4 py-2 bg-yellow-600 rounded-lg text-white hover:bg-yellow-700"
              >
                Enviar Justificación
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
