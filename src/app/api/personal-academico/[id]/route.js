import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const id = params.id;

    const [rows] = await pool.query(
      'SELECT * FROM personal_academico WHERE ID_Personal = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, mensaje: 'Personal académico no encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('Error al obtener personal académico por ID:', error);
    return NextResponse.json(
      { success: false, mensaje: 'Error al obtener personal académico.' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      curp,
      rol,
      correo,
      idEscuela
    } = body;

    const [result] = await pool.execute(
      `UPDATE personal_academico 
       SET Nombre = ?, Apellido_Paterno = ?, Apellido_Materno = ?, 
           Curp = ?, Rol = ?, Correo = ?, ID_Escuela = ? 
       WHERE ID_Personal = ?`,
      [nombre, apellidoPaterno, apellidoMaterno, curp, rol, correo, idEscuela, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, mensaje: 'No se encontró el personal académico a actualizar.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Personal académico actualizado correctamente.'
    });

  } catch (error) {
    console.error('Error al actualizar personal académico:', error);
    return NextResponse.json(
      { success: false, mensaje: 'Error al actualizar personal académico.' },
      { status: 500 }
    );
  }
}
