import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { pool } from "@/lib/db";

export async function POST(req) {
  try {
    const { usuario, tipo } = await req.json();

    // 1. Buscar usuario en tabla webauthnusuarios
    const [userRows] = await pool.execute(
      "SELECT id FROM webauthnusuarios WHERE usuario_id = ? AND tipo = ?",
      [usuario, tipo]
    );

    if (!userRows.length) {
      return NextResponse.json({
        success: false,
        error: "Este usuario no tiene registro biométrico",
      });
    }

    const webUserId = userRows[0].id;

    // 2. Obtener credenciales del usuario
    const [credRows] = await pool.execute(
      "SELECT credId FROM webauthncredenciales WHERE usuario_id = ?",
      [webUserId]
    );

    if (!credRows.length) {
      return NextResponse.json({
        success: false,
        error: "No se encontraron credenciales biométricas",
      });
    }

    const allowCredentials = credRows.map((row) => ({
      id: Buffer.from(row.credId),
      type: "public-key",
    }));

    // 3. Generar opciones
    const options = await generateAuthenticationOptions({
      rpID: "localhost",
      allowCredentials,
      userVerification: "preferred",
    });

    // 4. Guardar challenge
    await pool.execute(
      "INSERT INTO webauthn_challenges (user_id, challenge) VALUES (?, ?)",
      [webUserId, options.challenge]
    );

    return NextResponse.json({
      success: true,
      options,
      userId: webUserId,
    });

  } catch (error) {
    console.error("LOGIN BIOMÉTRICO ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Error en login biométrico" },
      { status: 500 }
    );
  }
}
