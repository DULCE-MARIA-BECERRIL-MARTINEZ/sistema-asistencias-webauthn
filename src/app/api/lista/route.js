import { pool } from '../../../lib/db';

export async function GET(req) {
  try {
    console.log('Consultando escuelas...');
    const [rows] = await pool.query('SELECT * FROM escuela');
    console.log('Escuelas obtenidas:', rows.length);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en GET /api/lista:', error);
    return new Response(JSON.stringify({ message: 'Error al obtener datos', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
