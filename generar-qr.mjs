// generar-qr.mjs
import mysql from 'mysql2/promise'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ Corrección para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ Configurar conexión sin importar db.js de Next.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_asistencias',
})

// ✅ Crear carpeta "qrs" si no existe
const qrDir = path.join(__dirname, 'qrs')
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir)
}

try {
  // 📥 Obtener todos los usuarios con credencial activa
  const [rows] = await pool.query(`
    SELECT pa.Correo AS usuario, c.Codigo AS contrasena
    FROM personal_academico pa
    JOIN Credencial c ON pa.ID_Personal = c.ID_Personal
    WHERE c.Estado = 'activo'
  `)

  for (const persona of rows) {
    const contenido = JSON.stringify({
      usuario: persona.usuario,
      contrasena: persona.contrasena,
    })

    const nombreArchivo = path.join(
      qrDir,
      `${persona.usuario.replace(/[@.]/g, '_')}.png`
    )

    await QRCode.toFile(nombreArchivo, contenido)
    console.log(`✅ QR generado para: ${persona.usuario}`)
  }

  console.log('🎉 Todos los códigos QR fueron generados en la carpeta "qrs/"')
  process.exit(0)
} catch (error) {
  console.error('❌ Error al generar los QR:', error)
  process.exit(1)
}
