'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { startAuthentication } from '@simplewebauthn/browser'

export default function LoginPage() {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [qrError, setQrError] = useState('')
  const [scanning, setScanning] = useState(false)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const router = useRouter()

  // --------------------------- LOGIN NORMAL ---------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena }),
    })

    const data = await res.json()

    if (data.success) {
      localStorage.setItem('usuario', JSON.stringify({
        id: data.usuario.idAdministrativo || data.usuario.id,
        nombre: data.usuario.nombre,
        apellidoPaterno: data.usuario.apellidoPaterno,
        apellidoMaterno: data.usuario.apellidoMaterno,
        rol: data.usuario.rol || data.tipo,
        tipo: data.tipo,
      }))

      if (data.tipo === 'administrativo') {
        router.push('/administrativo')
      } else if (data.tipo === 'personal_academico') {
        router.push('/personalacademico')
      } else {
        router.push('/')
      }
    } else {
      setError(data.mensaje)
    }
  }

  // --------------------------- LOGIN BIOMÉTRICO ---------------------------
const loginBiometrico = async () => {
  try {
    // pedir usuario y tipo (o usar usuario ya ingresado en formulario)
    const usuarioPrompt = usuario || window.prompt('Introduce tu correo/usuario para biometría (igual que en registro):');
    if (!usuarioPrompt) return alert('Usuario requerido');

    const tipoPrompt = window.prompt('Tipo: "personal_academico" o "administrativo"', 'personal_academico');
    if (!tipoPrompt) return alert('Tipo requerido');

    // 1) pedir opciones al servidor
    const resp = await fetch('/api/webauthn/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuarioPrompt, tipo: tipoPrompt })
    }).then(r => r.json());

    if (!resp.success) {
      return alert('No se puede iniciar autenticación: ' + (resp.error || resp.message));
    }

    const options = resp.options;

    // 2) startAuthentication
    const authResp = await startAuthentication(options);

    // 3) enviar al servidor para verificar
    const verify = await fetch('/api/webauthn/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resp.userId, tipo: tipoPrompt, authResp })
    }).then(r => r.json());

    if (verify.success) {
      // redirige según tipo
      if (verify.tipo === 'administrativo') router.push('/administrativo');
      else if (verify.tipo === 'personal_academico') router.push('/personalacademico');
      else router.push('/');
    } else {
      alert('Autenticación biométrica falló: ' + (verify.error || ''));
    }
  } catch (e) {
    console.error(e);
    alert('Error iniciando autenticación biométrica.');
  }
};

  // --------------------------- QR NUEVO Y CORREGIDO ---------------------------

  const startScanner = () => {
    setQrError('')
    setScanning(true)

    setTimeout(() => {
     const scanner = new Html5QrcodeScanner(
  'qr-reader',
  { fps: 10, qrbox: 250 },
  false
)


      scannerRef.current = scanner

      scanner.render(
        async (decodedText: string) => {
          try {
            const datos = JSON.parse(decodedText)

            if (datos.usuario && datos.contrasena) {
              const res = await fetch('/api/asistencia-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
              })

              const resultado = await res.json()

              await scanner.clear()
              setScanning(false)

              if (resultado.success) {
                const params = new URLSearchParams({
                  tipo: resultado.tipo,
                  nombre: resultado.nombre,
                  mensaje: resultado.mensaje,
                })

                window.open(`/asistencia-express?${params.toString()}`, '_blank')
              } else {
                setQrError(resultado.mensaje || 'QR inválido')
              }
            } else {
              setQrError('QR no contiene credenciales válidas.')
            }
          } catch {
            setQrError('QR inválido. Asegúrate que sea JSON válido.')
          }
        },
        () => {
          // ignore scan errors
        }
      )
    }, 300)
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.clear()
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center">

        <img src="/logo.png" alt="Logo" className="mx-auto mb-6 w-28 h-auto" />

        <h1 className="text-3xl font-bold text-blue-900 mb-6">Sistema de Asistencia</h1>

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          {error && <p className="text-center text-red-600 font-medium">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-800 hover:bg-blue-900 text-white py-2 rounded-xl font-semibold"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* LOGIN BIOMÉTRICO */}
        <button
          type="button"
          onClick={loginBiometrico}
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-xl font-semibold mt-3"
        >
          Acceso rápido con huella
        </button>

        {/* QR */}
        <div className="mt-6">
          {!scanning ? (
            <button onClick={startScanner} className="text-blue-700 underline text-sm">
              Escanear código QR
            </button>
          ) : (
            <button onClick={stopScanner} className="text-red-700 underline text-sm">
              Detener escaneo
            </button>
          )}
        </div>

        {qrError && <p className="text-red-600 mt-2 text-sm">{qrError}</p>}

        {scanning && (
          <div className="mt-4 border rounded overflow-hidden">
            <div id="qr-reader" className="w-full h-64" />
          </div>
        )}

        <footer className="mt-6 text-xs text-gray-500">
          © 2025 Proyecto de Registro de Asistencia
        </footer>
      </div>
    </main>
  )
}
