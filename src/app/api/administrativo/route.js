import { pool } from '@/lib/db';
export async function GET(request, { params }) {
  const { id } = params;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM Administrativo WHERE idAdministrativo = ?',
      [id]
    );
    if (rows.length > 0) {
      const admin = rows[0];
      return Response.json({
        success: true,
        administrativo: {
          idAdministrativo: admin.idAdministrativo,
          nombre: admin.Nombre,
          apellidoPaterno: admin.ApellidoPaterno,
          apellidoMaterno: admin.ApellidoMaterno,
        }
      });
    } else {
      return Response.json({ success: false, mensaje: 'Administrativo no encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error al obtener administrativo:', error);
    return Response.json({ success: false, mensaje: 'Error en el servidor' }, { status: 500 });
  }
}
