'use client'

import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterWebAuthn() {
  const [usuario, setUsuario] = useState('');
  const [tipo, setTipo] = useState<'personal_academico' | 'administrativo'>('personal_academico');
  const [msg, setMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    // 1) pedir opciones al servidor
    const resp = await fetch('/api/webauthn/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, tipo })
    }).then(r => r.json());

    if (!resp.success) {
      setMsg('Error al pedir options: ' + (resp.error || resp.message));
      return;
    }

    const options = resp.options;

    try {
      // 2) startRegistration (llamará al lector/hardware del dispositivo)
      const regResp = await startRegistration(options);

      // 3) enviar respuesta al servidor para verificar y guardar
      const verify = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resp.userId, tipo, attResp: regResp })
      }).then(r => r.json());

      if (verify.success) {
        setMsg('Registrado correctamente. Ya puedes usar huella para ingresar.');
      } else {
        setMsg('Fallo verificación: ' + (verify.error || ''));
      }
    } catch (err: any) {
      console.error(err);
      setMsg('Error registrando: ' + (err?.message || err));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Registrar huella (WebAuthn)</h2>

      <form onSubmit={handleRegister} className="space-y-3">
        <input placeholder="Correo o Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="w-full border p-2 rounded" required />

        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full border p-2 rounded">
          <option value="personal_academico">Personal académico (correo)</option>
          <option value="administrativo">Administrativo (usuario)</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Registrar huella</button>
      </form>

      {msg && <p className="mt-3">{msg}</p>}
    </div>
  );
}
