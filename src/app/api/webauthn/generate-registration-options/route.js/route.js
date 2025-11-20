// /app/api/webauthn/generate-registration-options/route.js
import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { pool } from '@/lib/db';

export async function POST(req) {
  try {
    const { usuario_id, tipo } = await req.json();

    if (!usuario_id || !tipo) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const options = generateRegistrationOptions({
      rpName: 'Sistema de Asistencias',
      rpID: 'localhost',
      userID: String(usuario_id),
      userName: `${usuario_id}-${tipo}`,
      attestationType: 'none',
    });

    await pool.query(
      'INSERT INTO webauthn_challenges (user_id, challenge) VALUES (?, ?)',
      [usuario_id, options.challenge]
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generando opciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
