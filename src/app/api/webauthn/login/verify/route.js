import { NextResponse } from "next/server";
import {
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { pool } from "@/lib/db";

export async function POST(req) {
  try {
    const { userId, tipo, authResp } = await req.json();

    // 1. Obtener último challenge
    const [chRows] = await pool.execute(
      "SELECT challenge FROM webauthn_challenges WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );

    if (!chRows.length) {
      return NextResponse.json(
        { success: false, error: "No existe challenge para este usuario" },
        { status: 400 }
      );
    }

    const expectedChallenge = chRows[0].challenge;

    // 2. Obtener credencial del usuario
    const [credRows] = await pool.execute(
      "SELECT * FROM webauthncredenciales WHERE usuario_id = ?",
      [userId]
    );

    if (!credRows.length) {
      return NextResponse.json(
        { success: false, error: "No se encontraron credenciales" },
        { status: 404 }
      );
    }

    const cred = credRows[0];

    // 3. Verificar autenticación
    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
      authenticator: {
        credentialID: Buffer.from(cred.credId),
        credentialPublicKey: Buffer.from(cred.publicKey),
        counter: cred.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({
        success: false,
        error: "Autenticación no válida",
      });
    }

    // 4. Actualizar counter
    await pool.execute(
      "UPDATE webauthncredenciales SET counter = ? WHERE id = ?",
      [verification.authenticationInfo.newCounter, cred.id]
    );

    return NextResponse.json({
      success: true,
      message: "Autenticación correcta",
      tipo,
    });

  } catch (error) {
    console.error("LOGIN VERIFY ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Error verificando autenticación" },
      { status: 500 }
    );
  }
}
