import { pool } from '@/lib/db';

// GET - Obtener todo el personal académico
export async function GET(req) {
  try {
    const [rows] = await pool.query('SELECT * FROM personal_academico');
    return Response.json({ success: true, personal: rows });
  } catch (error) {
    console.error('Error al obtener personal académico:', error);
    return Response.json(
      { success: false, mensaje: 'Error al obtener personal académico.' },
      { status: 500 }
    );
  }
}

// POST - Registrar nuevo personal académico
export async function POST(req) {
  try {
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
      `INSERT INTO personal_academico 
        (Nombre, Apellido_Paterno, Apellido_Materno, Curp, Rol, Correo, ID_Escuela) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellidoPaterno, apellidoMaterno, curp, rol, correo, idEscuela]
    );

    return Response.json({
      success: true,
      mensaje: 'Personal académico registrado correctamente.',
      idInsertado: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar personal académico:', error);
    return Response.json(
      { success: false, mensaje: 'Error al registrar personal académico.' },
      { status: 500 }
    );
  }
}
