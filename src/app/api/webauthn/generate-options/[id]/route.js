import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function GET(req, { params }) {
  try {
    const id = params.id;

    // =======================
    // 1. Verificar al usuario
    // =======================
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

    const usuario = rows[0];

    // =================================================
    // 2. Crear opciones WebAuthn (para lector de huella)
    // =================================================
    const options = generateRegistrationOptions({
      rpName: 'Sistema de Asistencias',
      rpID: process.env.WEBAUTHN_RPID,
      userID: String(usuario.ID_Personal),
      userName: usuario.Correo,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // 💚 laptop fingerprint
        userVerification: 'required',
      },
    });

    // =================================================
    // 3. Guardar registro previo en tabla webauthnusuarios
    // =================================================
    await pool.query(
      `INSERT INTO webauthnusuarios (usuario_id, tipo)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE tipo = VALUES(tipo)`,
      [usuario.ID_Personal, 'personal_academico']
    );

    return NextResponse.json({ success: true, options });

  } catch (error) {
    console.error('Error al generar opciones WebAuthn:', error);
    return NextResponse.json(
      { success: false, mensaje: 'Error al generar opciones.' },
      { status: 500 }
    );
  }
}
