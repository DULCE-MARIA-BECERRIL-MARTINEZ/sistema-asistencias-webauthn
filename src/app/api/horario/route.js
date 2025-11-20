import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nombreUsuario = searchParams.get('usuario')
  const dia = searchParams.get('dia')
  const id = searchParams.get('id')

  try {
    if (dia && id) {
      const [rows] = await pool.query(
        `SELECT ID_Horario, Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada
         FROM horario
         WHERE Dia_Semana = ? AND ID_Personal = ?`,
        [dia.toLowerCase(), id]
      )
      return NextResponse.json({ success: true, data: rows }, { status: 200 })
    }

    if (nombreUsuario) {
      const [personal] = await pool.query(
        'SELECT ID_Personal FROM personal_academico WHERE nombre = ?',
        [nombreUsuario]
      )
      if (personal.length === 0) {
        return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
      }

      const idPersonal = personal[0].ID_Personal
      const [horario] = await pool.query(
        'SELECT Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada FROM horario WHERE ID_Personal = ?',
        [idPersonal]
      )
      return NextResponse.json({ success: true, data: horario }, { status: 200 })
    }

    return NextResponse.json({ success: false, error: 'Parámetros insuficientes' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { ID_Personal, Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada } = body

    if (!ID_Personal || !Dia_Semana || !Hora_Entrada_Esperada || !Hora_Salida_Esperada) {
      return NextResponse.json({ success: false, message: 'Faltan datos' }, { status: 400 })
    }

    await pool.query(
      `INSERT INTO horario (ID_Personal, Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada)
       VALUES (?, ?, ?, ?)`,
      [ID_Personal, Dia_Semana.toLowerCase(), Hora_Entrada_Esperada, Hora_Salida_Esperada]
    )

    return NextResponse.json({ success: true, message: 'Horario guardado correctamente' }, { status: 200 })
  } catch (error) {
    console.error('Error en POST /api/horario:', error)
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { ID_Horario, ID_Personal, Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada } = body

    if (!ID_Horario || !ID_Personal || !Dia_Semana || !Hora_Entrada_Esperada || !Hora_Salida_Esperada) {
      return NextResponse.json({ success: false, message: 'Faltan datos' }, { status: 400 })
    }

    await pool.query(
      `UPDATE horario
       SET ID_Personal = ?, Dia_Semana = ?, Hora_Entrada_Esperada = ?, Hora_Salida_Esperada = ?
       WHERE ID_Horario = ?`,
      [ID_Personal, Dia_Semana.toLowerCase(), Hora_Entrada_Esperada, Hora_Salida_Esperada, ID_Horario]
    )

    return NextResponse.json({ success: true, message: 'Horario actualizado correctamente' }, { status: 200 })
  } catch (error) {
    console.error('Error en PUT /api/horario:', error)
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'Falta el ID del horario' }, { status: 400 })
    }

    await pool.query('DELETE FROM horario WHERE ID_Horario = ?', [id])

    return NextResponse.json({ success: true, message: 'Horario eliminado correctamente' }, { status: 200 })
  } catch (error) {
    console.error('Error en DELETE /api/horario:', error)
    return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 })
  }
}
