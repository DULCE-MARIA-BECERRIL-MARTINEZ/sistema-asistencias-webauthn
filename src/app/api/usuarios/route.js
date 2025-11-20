import { pool } from '@/lib/db'; // Asegúrate que aquí está tu conexión a MySQL

export async function GET() {
  try {
    // Traemos solo el id y nombre completo concatenado para dropdown
    const [rows] = await pool.execute(`
      SELECT ID_Personal, CONCAT(Nombre, ' ', Apellido_Paterno, ' ', Apellido_Materno) AS nombreCompleto
      FROM personal_academico
      ORDER BY nombreCompleto ASC
    `);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener usuarios' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
