import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { usuario, contrasena } = await req.json()

    const usuarioNormalizado = usuario.trim().toLowerCase()
    const contrasenaNormalizada = contrasena.trim()

    const [rows] = await pool.query(
      `SELECT pa.*, c.Codigo
       FROM personal_academico pa
       JOIN Credencial c ON pa.ID_Personal = c.ID_Personal
       WHERE LOWER(TRIM(pa.Correo)) = ? AND c.Codigo = ? AND c.Estado = 'activo'`,
      [usuarioNormalizado, contrasenaNormalizada]
    )

    if (rows.length === 0) {
      return NextResponse.json({ success: false, mensaje: 'QR no válido' }, { status: 401 })
    }

    const persona = rows[0]

    // ✅ 1. Buscar entrada sin salida
    const [registro] = await pool.query(
      `SELECT * FROM Asistencia 
       WHERE ID_Personal = ? AND Hora_Salida IS NULL 
       ORDER BY ID_Asistencia DESC LIMIT 1`,
      [persona.ID_Personal]
    )

    if (registro.length > 0) {
      // ✅ 2. Si hay entrada sin salida → registrar salida
      await pool.query(
        `UPDATE Asistencia 
         SET Hora_Salida = NOW(), Estado = ? 
         WHERE ID_Asistencia = ?`,
        ['Salida registrada (QR)', registro[0].ID_Asistencia]
      )

      return NextResponse.json({
        success: true,
        tipo: 'salida',
        mensaje: 'Salida registrada correctamente',
        nombre: persona.Nombre
      })
    } else {
      // ✅ 3. Si NO hay entrada previa → registrar entrada
      await pool.query(
        `INSERT INTO Asistencia (Estado, Hora_Entrada, Fecha, ID_Personal) 
         VALUES (?, NOW(), CURDATE(), ?)`,
        ['Entrada registrada (QR)', persona.ID_Personal]
      )

      return NextResponse.json({
        success: true,
        tipo: 'entrada',
        mensaje: 'Entrada registrada correctamente',
        nombre: persona.Nombre
      })
    }
  } catch (error) {
    console.error('❌ Error en asistencia-qr:', error)
    return NextResponse.json({ success: false, mensaje: 'Error en el servidor' }, { status: 500 })
  }
}
