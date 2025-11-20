import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id_personal = searchParams.get('id_personal')

  if (!id_personal) {
    return NextResponse.json({ success: false, error: 'Falta parámetro id_personal' }, { status: 400 })
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Asistencia WHERE ID_Personal = ? ORDER BY ID_Asistencia DESC',
      [id_personal]
    )
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { accion, ID_Personal, asunto, evidencia, horaEntradaEsperada, horaSalidaEsperada } = body

    if (!ID_Personal) {
      return NextResponse.json({ error: 'Falta ID_Personal' }, { status: 400 })
    }

    if (accion === 'entrada') {
      const [rows] = await pool.query(
        'SELECT * FROM Asistencia WHERE ID_Personal = ? AND Hora_Salida IS NULL ORDER BY ID_Asistencia DESC LIMIT 1',
        [ID_Personal]
      )
      if (rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe una entrada sin salida registrada' }, { status: 400 })
      }
      await pool.query(
        'INSERT INTO Asistencia (Estado, Hora_Entrada, ID_Personal) VALUES (?, NOW(), ?)',
        ['Entrada registrada', ID_Personal]
      )
      return NextResponse.json({ message: 'Entrada registrada' }, { status: 201 })
    }

    if (accion === 'salida') {
      const [rows] = await pool.query(
        'SELECT * FROM Asistencia WHERE ID_Personal = ? AND Hora_Salida IS NULL ORDER BY ID_Asistencia DESC LIMIT 1',
        [ID_Personal]
      )
      if (rows.length === 0) {
        return NextResponse.json({ error: 'No hay una entrada activa para registrar salida' }, { status: 400 })
      }
      await pool.query(
        'UPDATE Asistencia SET Hora_Salida = NOW(), Estado = ? WHERE ID_Asistencia = ?',
        ['Salida registrada', rows[0].ID_Asistencia]
      )
      return NextResponse.json({ message: 'Salida registrada' }, { status: 200 })
    }

    if (accion === 'justificar') {
      if (!asunto || !evidencia || !horaEntradaEsperada || !horaSalidaEsperada) {
        return NextResponse.json({ error: 'Faltan datos para justificar' }, { status: 400 })
      }

      const [rows] = await pool.query(
        `SELECT * FROM Asistencia WHERE ID_Personal = ? AND Estado = 'Justificación' AND DATE(Fecha) = CURDATE()`,
        [ID_Personal]
      )
      if (rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe una justificación registrada hoy' }, { status: 400 })
      }

      // Detectar tipo de archivo
      const mime = evidencia.substring(evidencia.indexOf(':') + 1, evidencia.indexOf(';'))
      let extension = ''
      if (mime === 'image/png') extension = '.png'
      else if (mime === 'image/jpeg') extension = '.jpg'
      else if (mime === 'application/pdf') extension = '.pdf'
      else {
        return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })
      }

      const base64Data = evidencia.split(';base64,').pop()
      const nombreArchivo = `evidencia_${ID_Personal}_${Date.now()}${extension}`
      const rutaDestino = path.join(process.cwd(), 'public', 'evidencias', nombreArchivo)
      await writeFile(rutaDestino, Buffer.from(base64Data, 'base64'))

      // Construir datetime combinando fecha actual + hora esperada
      const hoy = new Date()
      const fechaActual = hoy.toISOString().split('T')[0] // YYYY-MM-DD

      const entradaCompleta = `${fechaActual} ${horaEntradaEsperada}:00`
      const salidaCompleta = `${fechaActual} ${horaSalidaEsperada}:00`

      await pool.query(
        'INSERT INTO Asistencia (Estado, Asunto, Justificado, Hora_Entrada, Hora_Salida, Evidencia, ID_Personal, Fecha) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())',
        ['Justificación', asunto, 1, entradaCompleta, salidaCompleta, nombreArchivo, ID_Personal]
      )

      return NextResponse.json({ message: 'Justificación registrada correctamente' }, { status: 201 })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (error) {
    console.error('Error en POST asistencia:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
