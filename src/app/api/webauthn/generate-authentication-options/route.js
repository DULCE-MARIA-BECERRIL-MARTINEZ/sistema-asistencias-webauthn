// /app/api/webauthn/generate-authentication-options/route.js
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { pool } from '@/lib/db';

export async function POST(req) {
  try {
    const { usuario_id } = await req.json();

    const [creds] = await pool.query(
      'SELECT credId FROM webauthncredenciales WHERE usuario_id = ?',
      [usuario_id]
    );

    if (creds.length === 0)
      return NextResponse.json(
        { error: 'No hay credenciales registradas' },
        { status: 404 }
      );

    const options = generateAuthenticationOptions({
      allowCredentials: creds.map((c) => ({
        id: Buffer.from(c.credId),
        type: 'public-key',
      })),
      rpID: 'localhost',
    });

    await pool.query(
      'INSERT INTO webauthn_challenges (user_id, challenge) VALUES (?, ?)',
      [usuario_id, options.challenge]
    );

    return NextResponse.json(options);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
