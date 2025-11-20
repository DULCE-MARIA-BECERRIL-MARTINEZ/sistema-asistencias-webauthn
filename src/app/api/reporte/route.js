import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

function normalizarDia(dia) {
  return dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function horaAminutos(horaStr) {
  const [h, m] = horaStr.split(':').map(Number)
  return h * 60 + m
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuario = searchParams.get('usuario')

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no proporcionado' }, { status: 400 })
    }

    const [asistenciasRows] = await pool.query(
      `SELECT a.Fecha, a.Hora_Entrada, a.Hora_Salida, a.Asunto, a.Justificado, a.Verificado, a.Estado
       FROM asistencia a
       JOIN personal_academico p ON a.ID_Personal = p.ID_Personal
       WHERE p.Nombre = ?
       ORDER BY a.Fecha DESC`,
      [usuario]
    )

    if (!Array.isArray(asistenciasRows) || asistenciasRows.length === 0) {
      return NextResponse.json({
        totalPago: '$0.00',
        mensaje: 'No hay registros de asistencia para este usuario.',
        reporte: []
      })
    }

    const [horarioRows] = await pool.query(
      `SELECT Dia_Semana, Hora_Entrada_Esperada, Hora_Salida_Esperada
       FROM horario h
       JOIN personal_academico p ON h.ID_Personal = p.ID_Personal
       WHERE p.Nombre = ?`,
      [usuario]
    )

    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const tolerancia = 10

    const reporte = asistenciasRows.map((asistencia) => {
      const diaSemana = dias[new Date(asistencia.Fecha).getDay()]
      const horariosDia = horarioRows.filter(
        (h) => normalizarDia(h.Dia_Semana) === normalizarDia(diaSemana)
      )

      const realEntrada = asistencia.Hora_Entrada
        ? new Date(asistencia.Hora_Entrada).toISOString().substring(11, 16)
        : null
      const realSalida = asistencia.Hora_Salida
        ? new Date(asistencia.Hora_Salida).toISOString().substring(11, 16)
        : null

      let justificado = '—'
      let verificado = '—'
      let pago = 'Sin determinar'

      if (!realEntrada && !realSalida) {
        if (asistencia.Justificado && asistencia.Verificado) {
          pago = 'Justificado (Pago completo)'
          justificado = '✅ Justif.'
          verificado = '✅ Verif.'
        } else {
          pago = 'Falta (No asistió)'
        }
      } else if (horariosDia.length === 0) {
        pago = 'Sin horario asignado'
      } else {
        const minutosEntrada = horaAminutos(realEntrada)
        const minutosSalida = horaAminutos(realSalida)

        let coincidencia = false
        let pagoCompleto = false
        let pago75 = false

        for (const horario of horariosDia) {
          const esperadoEntrada = String(horario.Hora_Entrada_Esperada).substring(0, 5)
          const esperadoSalida = String(horario.Hora_Salida_Esperada).substring(0, 5)

          const esperadoMinEntrada = horaAminutos(esperadoEntrada)
          const esperadoMinSalida = horaAminutos(esperadoSalida)

          const entradaEnRango =
            minutosEntrada >= esperadoMinEntrada - tolerancia &&
            minutosEntrada <= esperadoMinSalida + tolerancia

          const salidaEnRango =
            minutosSalida >= esperadoMinEntrada - tolerancia &&
            minutosSalida <= esperadoMinSalida + tolerancia

          if (entradaEnRango && salidaEnRango) {
            coincidencia = true

            const entradaOk = minutosEntrada <= esperadoMinEntrada + tolerancia
            const salidaOk = minutosSalida >= esperadoMinSalida - tolerancia

            if (entradaOk && salidaOk) {
              pagoCompleto = true
              break
            } else if (entradaOk || salidaOk) {
              pago75 = true
            }
          }
        }

        if (!coincidencia) {
          pago = 'Fuera de horario (No válido)'
        } else if (pagoCompleto && !asistencia.Justificado && !asistencia.Verificado) {
          pago = 'Pago completo'
        } else if ((pagoCompleto || pago75) && (asistencia.Justificado || asistencia.Verificado)) {
          pago = 'Pago 75%'
          justificado = asistencia.Justificado ? '🟡 Justif.' : '🟡 Sin justificar'
          verificado = asistencia.Verificado ? '🟡 Verif.' : '🟡 Sin verificar'
        } else if (!pagoCompleto && !pago75) {
          if (asistencia.Justificado && asistencia.Verificado) {
            pago = 'Justificado (Pago completo)'
            justificado = '✅ Justif.'
            verificado = '✅ Verif.'
          } else {
            pago = 'Pago 50%'
            justificado = asistencia.Justificado ? '🟠 Justif.' : '❌'
            verificado = asistencia.Verificado ? '🟠 Verif.' : '❌'
          }
        } else {
          pago = 'Pago 75%'
          justificado = asistencia.Justificado ? '🟡 Justif.' : '🟡 Sin justificar'
          verificado = asistencia.Verificado ? '🟡 Verif.' : '🟡 Sin verificar'
        }
      }

      return {
        fecha: new Date(asistencia.Fecha).toISOString().substring(0, 10),
        entrada: realEntrada ?? '-',
        salida: realSalida ?? '-',
        estado: asistencia.Estado || '—',
        justificado,
        verificado,
        pago
      }
    })

    // Calcular totalPago
    let totalPago = 0
    for (const fila of reporte) {
      switch (fila.pago) {
        case 'Pago completo':
        case 'Justificado (Pago completo)':
          totalPago += 100
          break
        case 'Pago 75%':
          totalPago += 75
          break
        case 'Pago 50%':
          totalPago += 50
          break
        default:
          totalPago += 0
      }
    }

    return NextResponse.json({
      totalPago: `$${totalPago}.00`,
      reporte
    })
  } catch (error) {
    console.error('Error al generar el reporte de asistencias:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

