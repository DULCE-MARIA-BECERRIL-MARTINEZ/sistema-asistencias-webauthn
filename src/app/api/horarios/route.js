import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, p.Nombre, p.Apellido_Paterno, p.Apellido_Materno
      FROM horario h
      JOIN personal_academico p ON h.ID_Personal = p.ID_Personal
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener horarios del personal' }, { status: 500 });
  }
}
