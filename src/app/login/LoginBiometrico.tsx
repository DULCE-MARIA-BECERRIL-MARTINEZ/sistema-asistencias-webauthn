'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginBiometrico() {
  const [faceapi, setFaceapi] = useState<any>(null)
  const [error, setError] = useState('')
  const [loadingModels, setLoadingModels] = useState(true)
  const [scanning, setScanning] = useState(false)

  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cargar librería
  useEffect(() => {
    const load = async () => {
      const fa = await import('@vladmandic/face-api')
      setFaceapi(fa)
    }
    load()
  }, [])

  // Cargar modelos
  useEffect(() => {
    if (!faceapi) return
    cargarModelos()
  }, [faceapi])

  const cargarModelos = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.load('/models/')
      await faceapi.nets.faceLandmark68Net.load('/models/')
      await faceapi.nets.faceRecognitionNet.load('/models/')
      setLoadingModels(false)
    } catch (err) {
      console.error(err)
      setError('Error al cargar modelos')
    }
  }

  // Iniciar cámara
  const iniciarCamara = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    streamRef.current = stream

    const vid = videoRef.current
    if (!vid) return

    vid.srcObject = stream
    await vid.play()
  }

  // APAGAR cámara
  const apagarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  // Detección continua (loop)
  const loopDeteccion = async () => {
    if (!faceapi || !videoRef.current) return

    const deteccion = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (deteccion) {
      // rostro detectado
      autenticar(deteccion.descriptor)
      return
    }

    if (scanning) requestAnimationFrame(loopDeteccion)
  }

  // Botón biometría
  const handleBiometria = async () => {
    setError('')
    setScanning(true)

    await iniciarCamara()

    // empezar loop continuo
    loopDeteccion()

    // detener si en 10 segundos no hay rostro
    setTimeout(() => {
      if (scanning) {
        setScanning(false)
        apagarCamara()
        setError('No se detectó un rostro. Intenta de nuevo.')
      }
    }, 10000)
  }

  // Autenticación en backend
  const autenticar = async (descriptor: any) => {
    setScanning(false)
    apagarCamara()

    const res = await fetch('/api/login-biometrico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descriptor })
    })

    const data = await res.json()

    if (!data.success) {
      setError(data.message)
      return
    }

    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    router.push(data.redireccion)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-10 shadow-xl rounded-xl text-center">

        <h1 className="text-2xl font-bold mb-4">Acceso Biométrico</h1>

        {loadingModels && <p>Cargando modelos...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-72 h-56 bg-black rounded-xl mx-auto mb-4"
        />

        <button
          onClick={handleBiometria}
          disabled={loadingModels || scanning}
          className="bg-blue-800 hover:bg-blue-900 text-white py-3 px-5 rounded-xl disabled:bg-gray-400"
        >
          {scanning ? 'Escaneando...' : 'Iniciar Reconocimiento Facial'}
        </button>

      </div>
    </main>
  )
}

