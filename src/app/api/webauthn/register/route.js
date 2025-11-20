import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const idUsuario = body.userId || body.usuario;
    const tipo = body.tipo || "personal_academico";

    if (!idUsuario) {
      return NextResponse.json({ success: false, error: "userId requerido" }, { status: 400 });
    }

    // --- Lógica de Búsqueda y Creación de Usuario ---
    const [personal] = await pool.query(
      "SELECT * FROM personal_academico WHERE ID_Personal = ?",
      [idUsuario]
    );

    if (personal.length === 0) {
      return NextResponse.json({ success: false, error: "Personal académico no encontrado" }, { status: 404 });
    }

    const persona = personal[0];
    
    // Asegurar que el usuario exista en webauthnusuarios
    const [webUser] = await pool.query(
      "SELECT * FROM webauthnusuarios WHERE usuario_id = ?",
      [idUsuario]
    );
    if (webUser.length === 0) {
      await pool.query(
        "INSERT INTO webauthnusuarios (usuario_id, tipo, nombre) VALUES (?, ?, ?)",
        [idUsuario, tipo, persona.Nombre]
      );
    }

    const [webauthn] = await pool.query(
      "SELECT * FROM webauthnusuarios WHERE usuario_id = ?",
      [idUsuario]
    );

    const user = webauthn[0];
    
    // --- Búsqueda de Credenciales Existentes (para evitar duplicados) ---
    const [rows] = await pool.execute(
        'SELECT credId FROM webauthncredenciales WHERE usuario_id = ?', 
        [idUsuario]
    );

    const excludeCredentials = rows.map(row => ({
        id: row.credId,
        type: 'public-key',
    }));

    // --- Generar Opciones WebAuthn ---
    const NG_ROK_DOMAIN = "roger-bausond-basically.ngrok-free.dev"; // ¡Asegúrate que este es tu dominio!
    const USER_ID_BUFFER = new TextEncoder().encode(String(user.usuario_id));

    const options = await generateRegistrationOptions({
      rpName: "Sistema de Asistencias",
      rpID: NG_ROK_DOMAIN, // Usar dominio HTTPS (Ngrok)
      userID: USER_ID_BUFFER,
      userName: user.nombre || "usuario",
      userDisplayName: user.nombre || "Usuario",
      attestationType: "none",
      timeout: 60000,
      
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
        // 🚨 CAMBIO A CROSS-PLATFORM: Acepta credenciales sincronizadas (Nube/Teléfono)
        authenticatorAttachment: 'cross-platform', 
      },
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials,
    });

    // 4. GUARDAR CHALLENGE CORRECTAMENTE 
    await pool.query(
        "DELETE FROM webauthn_challenges WHERE user_id = ?",
        [idUsuario]
    );

    await pool.query(
      "INSERT INTO webauthn_challenges (user_id, challenge) VALUES (?, ?)",
      [idUsuario, options.challenge]
    );
    
    console.log("🔵 CHALLENGE GENERADO:", options.challenge);

    return NextResponse.json({ success: true, options });

  } catch (error) {
    console.error("❌ ERROR REGISTER:", error);
    return NextResponse.json({ success: false, error: "Error interno: " + error.message }, { status: 500 });
  }
}