import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.ID_Asistencia, a.Fecha, a.Asunto, a.Evidencia,
        p.Nombre AS nombre,
        p.Apellido_Paterno AS apellidoPaterno,
        p.Apellido_Materno AS apellidoMaterno
      FROM asistencia a
      JOIN personal_academico p ON a.ID_Personal = p.ID_Personal
      WHERE a.Asunto IS NOT NULL AND a.Justificado = 1 AND a.Verificado = 0
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener justificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener justificaciones' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, action } = await request.json();

    if (!id || !['aceptar', 'rechazar'].includes(action)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const nuevoEstado = action === 'aceptar' ? 1 : -1;

    await pool.query(
      'UPDATE asistencia SET Verificado = ? WHERE ID_Asistencia = ?',
      [nuevoEstado, id]
    );

    return NextResponse.json({ message: 'Acción aplicada correctamente' });
  } catch (error) {
    console.error('Error al actualizar justificación:', error);
    return NextResponse.json({ error: 'Error al actualizar justificación' }, { status: 500 });
  }
}
