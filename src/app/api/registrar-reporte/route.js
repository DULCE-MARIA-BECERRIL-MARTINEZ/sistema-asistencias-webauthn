import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req) {
  const { tipo } = await req.json();

  const fechaHoy = new Date().toISOString().slice(0, 10);
  const urlArchivo = `/reportes/reporte_${tipo}_${fechaHoy}.pdf`; // Puedes adaptar según lógica real

  await pool.execute(
    `INSERT INTO reporte (Tipo_Reporte, Fecha_Generacion, URL_Archivo) VALUES (?, ?, ?)`,
    [tipo, fechaHoy, urlArchivo]
  );

  return NextResponse.json({ ok: true });
}
