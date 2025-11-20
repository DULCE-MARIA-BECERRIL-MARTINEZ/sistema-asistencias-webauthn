import { pool } from '../../../lib/db';

export async function POST(req) {
  try {
    const { usuario, contrasena } = await req.json();

    // 1. Intentar login como personal académico
    const [personalRows] = await pool.execute(
      `SELECT pa.*, c.Codigo
       FROM personal_academico pa
       JOIN Credencial c ON pa.ID_Personal = c.ID_Personal
       WHERE pa.Correo = ? 
         AND c.Codigo = ?
         AND c.Estado = 'activo'`,
      [usuario, contrasena]
    );

    if (personalRows.length > 0) {
      const pa = personalRows[0];
      return Response.json({
        success: true,
        tipo: 'personal_academico',
        mensaje: 'Acceso autorizado como personal académico',
        usuario: {
          id: pa.ID_Personal,
          nombre: pa.Nombre,
          apellidoPaterno: pa.Apellido_Paterno,
          apellidoMaterno: pa.Apellido_Materno,
          correo: pa.Correo,
          rol: pa.Rol,
        },
      });
    }

    // 2. Login administrativo
    const [adminRows] = await pool.execute(
      'SELECT * FROM Administrativo WHERE Usuario = ? AND Contraseña = ?',
      [usuario, contrasena]
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      return Response.json({
        success: true,
        tipo: 'administrativo',
        mensaje: 'Acceso autorizado como administrativo',
        usuario: {
          idAdministrativo: admin.ID_Administrativo,
          nombre: admin.Nombre,
          apellidoPaterno: admin.ApellidoPaterno,
          apellidoMaterno: admin.ApellidoMaterno,
        },
      });
    }

    return Response.json({ success: false, mensaje: 'Credenciales incorrectas' });

  } catch (error) {
    console.error('Error en login:', error);
    return Response.json({ success: false, mensaje: 'Error en el servidor' }, { status: 500 });
  }
}
