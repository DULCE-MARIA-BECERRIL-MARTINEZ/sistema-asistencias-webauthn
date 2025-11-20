import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const idPersonal = params.id;

    // Obtener los horarios filtrando por ID_Personal
    const [rows] = await pool.query(
      'SELECT * FROM horario WHERE ID_Personal = ?',
      [idPersonal]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener horarios del personal' }, { status: 500 });
  }
}
export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const { Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada } = body;
    await pool.execute(
      `UPDATE horario
       SET Dia_Semana = ?, Hora_Entrada_Esperada = ?, Hora_Salida_Esperada = ?
       WHERE ID_Horario = ?`,
      [Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada, params.id]
    );

    return NextResponse.json({ message: 'Horario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el horario' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await pool.execute(
      `DELETE FROM horario WHERE ID_Horario = ?`,
      [params.id]
    );

    return NextResponse.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar el horario' }, { status: 500 });
  }
}
