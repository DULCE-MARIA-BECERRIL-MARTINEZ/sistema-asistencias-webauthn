'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ✅ Extiende jsPDF para que reconozca `lastAutoTable`
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
  }
}

type Asistencia = {
  fecha: string
  entrada: string
  salida: string
  justificado: string | boolean
  verificado: string | boolean
  pago: string
}

export default function ReporteDocentePage() {
  const [nombre, setNombre] = useState('')
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [totalPago, setTotalPago] = useState('')
  const router = useRouter()

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const nombreUsuario = datosUsuario.nombre || 'Usuario'
    setNombre(nombreUsuario)

    const obtenerReporte = async () => {
      try {
        const response = await fetch(`/api/reporte?usuario=${nombreUsuario}`)
        if (!response.ok) throw new Error('Error al obtener reporte')
        const data = await response.json()
        setAsistencias(data.reporte || [])
        setTotalPago(data.totalPago || '$0.00')
      } catch (error) {
        console.error('Error al cargar reporte:', error)
      }
    }

    obtenerReporte()
  }, [])

  const volver = () => {
    router.push('/personalacademico')
  }

  const generarPDF = () => {
    const doc = new jsPDF()
    doc.text(`Reporte de Asistencias - ${nombre}`, 14, 15)

    autoTable(doc, {
      startY: 25,
      head: [['Fecha', 'Entrada', 'Salida', 'Justificado', 'Verificado', 'Pago']],
      body: asistencias.map((item) => [
        item.fecha,
        item.entrada || '-',
        item.salida || '-',
        typeof item.justificado === 'boolean'
          ? item.justificado ? '✅' : '❌'
          : item.justificado,
        typeof item.verificado === 'boolean'
          ? item.verificado ? '✅' : '❌'
          : item.verificado,
        item.pago,
      ]),
    })

    doc.text(`Total a pagar: ${totalPago}`, 14, doc.lastAutoTable.finalY + 10)
    doc.save(`reporte_asistencias_${nombre}.pdf`)
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-10 flex flex-col items-center">
      <img
        src="/logo.png"
        alt="Logo del sistema"
        className="mx-auto mb-5 w-60 h-auto"
      />

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#0a2e63]">
            Reporte de Asistencias
          </h1>
          <p className="text-lg text-[#1c3f74] mt-2">Docente: {nombre}</p>
        </div>

        {asistencias.length === 0 ? (
          <p className="text-center text-gray-500">Cargando asistencias...</p>
        ) : (
          <>
            <div className="overflow-auto max-h-[500px] mb-4">
              <table className="w-full text-sm border border-gray-300 rounded-lg">
                <thead className="bg-[#0a2e63] text-white text-left">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Entrada</th>
                    <th className="p-3">Salida</th>
                    <th className="p-3">Justificado</th>
                    <th className="p-3">Verificado</th>
                    <th className="p-3">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                      <td className="p-3">{item.fecha}</td>
                      <td className="p-3">{item.entrada || '-'}</td>
                      <td className="p-3">{item.salida || '-'}</td>
                      <td className="p-3">
                        {typeof item.justificado === 'boolean'
                          ? item.justificado ? '✅' : '❌'
                          : item.justificado}
                      </td>
                      <td className="p-3">
                        {typeof item.verificado === 'boolean'
                          ? item.verificado ? '✅' : '❌'
                          : item.verificado}
                      </td>
                      <td className="p-3 font-semibold">{item.pago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-right text-lg font-bold text-gray-700 mb-4">
              Total a pagar: {totalPago}
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={generarPDF}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-xl font-semibold transition"
              >
                Descargar PDF
              </button>
              <button
                onClick={volver}
                className="bg-[#0a2e63] hover:bg-[#092750] text-white py-2 px-6 rounded-xl font-semibold transition"
              >
                Regresar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
