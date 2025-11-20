import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { pool } from "@/lib/db";

export async function POST(req) {
  try {
    const { usuario, attestation } = await req.json();

    if (!usuario || !attestation) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // --- Definición manual de dominio ---
    const NG_ROK_DOMAIN = "roger-bausond-basically.ngrok-free.dev";
    const EXPECTED_ORIGIN = `https://${NG_ROK_DOMAIN}`; // Origen completo con HTTPS

    // Obtener challenge
    const [challenges] = await pool.query(
      "SELECT * FROM webauthn_challenges WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [usuario]
    );

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Challenge no encontrado" }, { status: 400 });
    }

    const challenge = challenges[0].challenge;

    // Validación WebAuthn
    const verification = await verifyRegistrationResponse({
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGIN, // Usar el origen completo con HTTPS
      expectedRPID: NG_ROK_DOMAIN, // Usar solo el dominio (RPID)
      response: attestation,
      requireUserVerification: true, 
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verificación fallida" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey } = verification.registrationInfo;

    // Convertir Buffers a Base64URL para MySQL
    const finalCredentialID = credentialID.toString('base64url');
    const finalCredentialPublicKey = credentialPublicKey.toString('base64url');

    // Guardar credencial
    await pool.query(
      `INSERT INTO webauthncredenciales (usuario_id, credId, pubKey)
       VALUES (?, ?, ?)`,
      [usuario, finalCredentialID, finalCredentialPublicKey]
    );

    // Limpiar el challenge después del éxito
    await pool.query(
        "DELETE FROM webauthn_challenges WHERE user_id = ?",
        [usuario]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("❌ VERIFY ERROR:", e);
    return NextResponse.json({ error: "Error en la verificación: " + e.message }, { status: 500 });
  }
}