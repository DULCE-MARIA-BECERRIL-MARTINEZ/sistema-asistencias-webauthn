import { pool } from '@/lib/db';

// GET - Obtener todas las relaciones docente-escuela con nombres y días
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        de.ID,
        CONCAT(pa.Nombre, ' ', pa.Apellido_Paterno, ' ', pa.Apellido_Materno) AS Docente,
        e.Nombre AS Escuela,
        de.Hora_Entrada,
        de.Hora_Salida,
        de.Dias
      FROM docente_escuela de
      JOIN personal_academico pa ON de.ID_Personal = pa.ID_Personal
      JOIN escuela e ON de.ID_Escuela = e.ID_Escuela
    `);

    return Response.json(rows);
  } catch (error) {
    console.error('Error al obtener relaciones docente-escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener relaciones' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST - Registrar nueva relación docente-escuela con horarios y días
export async function POST(req) {
  try {
    const { ID_Personal, ID_Escuela, Hora_Entrada, Hora_Salida, Dias } = await req.json();

    if (!ID_Personal || !ID_Escuela || !Hora_Entrada || !Hora_Salida || !Dias) {
      return new Response(JSON.stringify({ error: 'Campos incompletos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await pool.query(
      `INSERT INTO docente_escuela 
        (ID_Personal, ID_Escuela, Hora_Entrada, Hora_Salida, Dias) 
        VALUES (?, ?, ?, ?, ?)`,
      [ID_Personal, ID_Escuela, Hora_Entrada, Hora_Salida, Dias]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al registrar asignación docente-escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al registrar asignación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE - Eliminar relación por ID
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID es requerido para eliminar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [result] = await pool.query('DELETE FROM docente_escuela WHERE ID = ?', [id]);

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'Asignación no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar asignación docente-escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar asignación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


