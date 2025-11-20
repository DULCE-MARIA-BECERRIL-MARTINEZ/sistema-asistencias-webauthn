import { pool } from '@/lib/db';

// OBTENER TODAS LAS ESCUELAS
export async function GET(req) {
  try {
    const [rows] = await pool.query('SELECT ID_Escuela, Nombre, Direccion, Clave_CCT FROM escuela');
    return Response.json(rows);
  } catch (error) {
    console.error('Error al obtener escuelas:', error);
    return new Response(JSON.stringify({ error: 'Error al obtener escuelas' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// CREAR ESCUELA
export async function POST(req) {
  try {
    const { nombre, direccion, cct } = await req.json();

    if (!nombre || !direccion || !cct) {
      return new Response(JSON.stringify({ error: 'Campos incompletos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await pool.query(
      'INSERT INTO escuela (Nombre, Direccion, Clave_CCT) VALUES (?, ?, ?)',
      [nombre, direccion, cct]
    );

    return new Response(null, { status: 201 });
  } catch (error) {
    console.error('Error al crear escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al crear escuela' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ACTUALIZAR ESCUELA
export async function PUT(req) {
  try {
    const { id, nombre, direccion, cct } = await req.json();

    if (!id || !nombre || !direccion || !cct) {
      return new Response(JSON.stringify({ error: 'Campos incompletos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [result] = await pool.query(
      'UPDATE escuela SET Nombre = ?, Direccion = ?, Clave_CCT = ? WHERE ID_Escuela = ?',
      [nombre, direccion, cct, id]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'Escuela no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar escuela' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ELIMINAR ESCUELA
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID es requerido para eliminar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [result] = await pool.query('DELETE FROM escuela WHERE ID_Escuela = ?', [id]);

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'Escuela no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar escuela:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar escuela' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
