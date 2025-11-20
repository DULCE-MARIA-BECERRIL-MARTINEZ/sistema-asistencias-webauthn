import { pool } from "@/lib/db";
import { challengeStore } from "@/lib/webauthnStore";
import * as faceapi from '@vladmandic/face-api'
import { decode } from 'base64-arraybuffer'
import path from 'path'
import { Canvas, Image, ImageData } from 'canvas'

faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

// Cargar modelos solo una vez
let modelosCargados = false

async function cargarModelos() {
  if (modelosCargados) return

  const modelPath = path.join(process.cwd(), 'public/models')

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath)

  modelosCargados = true
}

export async function POST(req) {
  try {
    const { imagen } = await req.json()

    await cargarModelos()

    // Convertir Base64 → Buffer
    const buffer = Buffer.from(imagen.split(',')[1], 'base64')

    // Crear imagen desde buffer
    const img = new Image()
    img.src = buffer

    // Detectar rostro
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return Response.json({ success: false, mensaje: 'No se detectó rostro.' })
    }

    // Buscar coincidencia en DB
    const [rows] = await pool.execute('SELECT * FROM PersonalBiometria')

    let coincidencia = null

    for (const persona of rows) {
      const descriptorGuardado = Float32Array.from(JSON.parse(persona.VectorRostro))
      const distancia = faceapi.euclideanDistance(
        detection.descriptor,
        descriptorGuardado
      )

      if (distancia < 0.55) {
        coincidencia = persona
        break
      }
    }

    if (!coincidencia) {
      return Response.json({ success: false, mensaje: 'Biometría no coincide.' })
    }

    return Response.json({
      success: true,
      usuario: {
        id: coincidencia.ID_Personal,
        nombre: coincidencia.Nombre,
        apellidoPaterno: coincidencia.Apellido_Paterno,
        apellidoMaterno: coincidencia.Apellido_Materno,
        rol: coincidencia.Rol,
      },
      redireccion:
        coincidencia.Rol === 'administrativo'
          ? '/administrativo'
          : '/personalacademico',
    })
  } catch (error) {
    console.error('ERROR LOGIN BIOMETRICO:', error)
    return Response.json({ success: false, mensaje: 'Error en servidor' })
  }
}
