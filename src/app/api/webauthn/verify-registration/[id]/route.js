import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

export async function POST(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { response, expectedChallenge } = body;

    if (!response || !expectedChallenge) {
      return NextResponse.json(
        { success: false, mensaje: 'Datos de verificación incompletos.' },
        { status: 400 }
      );
    }

    // ==========================
    // 1. Verificar registro WebAuthn
    // ==========================
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN,
      expectedRPID: process.env.WEBAUTHN_RPID,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { success: false, mensaje: 'Verificación fallida.' },
        { status: 400 }
      );
    }

    const { credentialID, credentialPublicKey } = verification.registrationInfo;

    // ===========================================
    // 2. Guardar los datos del registro en la BD
    // ===========================================
    await pool.query(
      `UPDATE webauthnusuarios 
       SET nombre = ?, credentialID = ?, credentialPublicKey = ?
       WHERE usuario_id = ?`,
      [
        response.id,
        credentialID,
        credentialPublicKey,
        id
      ]
    );

    return NextResponse.json({ success: true, mensaje: 'Huella registrada correctamente.' });

  } catch (error) {
    console.error('Error al verificar huella:', error);
    return NextResponse.json(
      { success: false, mensaje: 'Error al verificar registro.' },
      { status: 500 }
    );
  }
}
