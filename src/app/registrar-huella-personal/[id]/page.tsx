'use client';

import { useState } from "react";
import { useParams } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

export default function RegistrarHuellaPersonal() {
  const params = useParams();
  const userId = params.id;

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarHuella = async () => {
    try {
      setCargando(true);
      setMensaje("");

      if (!userId) {
        setMensaje("No se recibió el ID del usuario.");
        return;
      }

      // 1) Pedir opciones al backend
      const resp = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId) }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        setMensaje("Error al generar opciones: " + (data.error || resp.statusText));
        return;
      }

      // 2) Iniciar registro de huella
      const attestation = await startRegistration(data.options);

      // 3) Confirmar en backend
      const resp2 = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          attestation,
        }),
      });

      const result2 = await resp2.json();

      if (!resp2.ok || result2.error) {
        setMensaje("Error en la verificación: " + (result2.error || resp2.statusText));
        return;
      }

      setMensaje("Huella registrada correctamente 🎉");

    } catch (error) {
      console.error("ERROR REGISTRO:", error);
      setMensaje("Error: " + String(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Registrador Huella (WebAuthn)</h1>
      <p>ID del Usuario: <strong>{userId}</strong></p>

      <button onClick={registrarHuella} disabled={cargando}>
        {cargando ? "Registrando..." : "Registradora Huella"}
      </button>

      <p style={{ marginTop: 20, color: "red" }}>{mensaje}</p>
    </div>
  );
}

