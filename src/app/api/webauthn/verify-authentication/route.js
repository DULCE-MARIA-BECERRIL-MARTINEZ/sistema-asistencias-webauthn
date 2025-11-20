// /app/api/webauthn/verify-authentication/route.js
import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { pool } from '@/lib/db';

export async function POST(req) {
  try {
    const { response, usuario_id } = await req.json();

    const [challengeRows] = await pool.query(
      'SELECT challenge FROM webauthn_challenges WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [usuario_id]
    );

    const expectedChallenge = challengeRows[0].challenge;

    const [credRows] = await pool.query(
      'SELECT * FROM webauthncredenciales WHERE usuario_id = ?',
      [usuario_id]
    );

    if (credRows.length === 0)
      return NextResponse.json({ error: 'Credencial no encontrada' }, { status: 404 });

    const cred = credRows[0];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: 'http://localhost:3000',
      expectedRPID: 'localhost',
      authenticator: {
        credentialID: cred.credId,
        credentialPublicKey: cred.publicKey,
        counter: cred.counter,
      },
    });

    if (verification.verified) {
      await pool.query(
        'UPDATE webauthncredenciales SET counter = ? WHERE id = ?',
        [verification.authenticationInfo.newCounter, cred.id]
      );
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
