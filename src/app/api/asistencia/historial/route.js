import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id_personal = searchParams.get('id_personal')

  if (!id_personal) {
    return NextResponse.json(
      { success: false, error: 'Falta parámetro id_personal' },
      { status: 400 }
    )
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Asistencia WHERE ID_Personal = ? ORDER BY Fecha DESC LIMIT 20',
      [id_personal]
    )
    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

