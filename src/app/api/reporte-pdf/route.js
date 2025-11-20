import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

function formatFecha(fechaStr) {
  try {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

function formatTime(value) {
  if (!value) return '-';
  if (typeof value === 'string') {
    const parts = value.split(':');
    if (parts.length < 2) return '-';
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  try {
    const date = new Date(value);
    if (isNaN(date)) return '-';

    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');

    return `${h}:${m}`;
  } catch {
    return '-';
  }
}

function normalizarDia(dia) {
  return dia.trim().toUpperCase();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const usuario = searchParams.get('usuario');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Faltan parámetros de fecha' }, { status: 400 });
    }

    let query = `
      SELECT a.Fecha, a.Hora_Entrada, a.Hora_Salida, a.ID_Personal,
             a.Justificado, a.Verificado,
             CONCAT(p.Nombre, ' ', p.Apellido_Paterno, ' ', p.Apellido_Materno) AS NombreCompleto
      FROM asistencia a
      JOIN personal_academico p ON a.ID_Personal = p.ID_Personal
      WHERE a.Fecha BETWEEN ? AND ?
    `;
    const params = [fechaInicio, fechaFin];

    if (usuario && usuario.trim() !== '') {
      query += ` AND CONCAT(p.Nombre, ' ', p.Apellido_Paterno, ' ', p.Apellido_Materno) LIKE ?`;
      params.push(`%${usuario}%`);
    }

    query += ` ORDER BY NombreCompleto, a.Fecha ASC`;

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No se encontraron registros' }, { status: 404 });
    }

    const usuariosAgrupados = rows.reduce((acc, row) => {
      if (!acc[row.ID_Personal]) {
        acc[row.ID_Personal] = {
          nombre: row.NombreCompleto,
          registros: []
        };
      }
      acc[row.ID_Personal].registros.push(row);
      return acc;
    }, {});

    const [horarios] = await pool.execute(`
      SELECT h.ID_Personal, h.Dia_Semana, h.Hora_Entrada_Esperada, h.Hora_Salida_Esperada
      FROM horario h
      ORDER BY h.ID_Personal, FIELD(h.Dia_Semana, 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO')
    `);

    const horariosAgrupados = horarios.reduce((acc, row) => {
      if (!acc[row.ID_Personal]) acc[row.ID_Personal] = {};
      const diaNorm = normalizarDia(row.Dia_Semana);
      if (!acc[row.ID_Personal][diaNorm]) acc[row.ID_Personal][diaNorm] = [];
      acc[row.ID_Personal][diaNorm].push({
        entrada: row.Hora_Entrada_Esperada,
        salida: row.Hora_Salida_Esperada
      });
      return acc;
    }, {});

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Asistencia</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      text-transform: uppercase;
      border-block-end: 2px solid #000;
      padding-block-end: 10px;
      margin-block-end: 20px;
    }
    h2 {
      font-size: 18px;
      margin-block-start: 40px;
      margin-block-end: 10px;
      color: #2c3e50;
    }
    ul {
      margin-block-end: 20px;
      padding-inline-start: 20px;
      font-size: 14px;
    }
    table {
      inline-size: 100%;
      border-collapse: collapse;
      margin-block-end: 30px;
    }
    th, td {
      border: 1px solid #999;
      padding: 8px 12px;
      font-size: 14px;
      text-align: center;
    }
    th {
      background-color: #f0f0f0;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .range {
      font-size: 14px;
      margin-block-end: 20px;
    }
    .leyenda {
      font-size: 12px;
      margin-block-start: 10px;
      font-style: italic;
    }
    .justificada {
      color: blue;
      font-weight: bold;
    }
    .pendiente {
      color: darkorange;
      font-weight: bold;
    }
    .dentro {
      color: green;
      font-weight: bold;
    }
    .fuera {
      color: red;
      font-weight: bold;
    }
    hr {
      border: none;
      border-block-start: 1px dashed #999;
      margin: 40px 0;
    }
  </style>
</head>
<body>
  <h1>REPORTE DE ASISTENCIA DEL PERSONAL ACADÉMICO</h1>
  <p class="range"><strong>Rango de fechas:</strong> ${formatFecha(fechaInicio)} a ${formatFecha(fechaFin)}</p>

  ${Object.entries(usuariosAgrupados).map(([id, data]) => {
    const horariosPorDia = horariosAgrupados[id] || {};
    return `
      <h2>${data.nombre}</h2>

      <p><strong>Horario esperado:</strong></p>
      <ul>
        ${
          Object.entries(horariosPorDia).length === 0
            ? '<li>No hay horario asignado</li>'
            : Object.entries(horariosPorDia).map(([dia, bloques]) => `
          <li><strong>${dia}:</strong> ${bloques.map(h => `${formatTime(h.entrada)} - ${formatTime(h.salida)}`).join(', ')}</li>
        `).join('')
        }
      </ul>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora de Entrada</th>
            <th>Hora de Salida</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.registros.map(r => {
            const fecha = new Date(r.Fecha);
            const diaSemana = normalizarDia(fecha.toLocaleDateString('es-MX', { weekday: 'long' }));
            const esperado = horariosPorDia[diaSemana];

            const entradaReal = r.Hora_Entrada ? new Date(`${r.Fecha}T${r.Hora_Entrada}`) : null;
            const salidaReal = r.Hora_Salida ? new Date(`${r.Fecha}T${r.Hora_Salida}`) : null;

            function interpretarEstado() {
              if (r.Justificado === 1 && r.Verificado === 1) {
                return `<span class="justificada">🟡 Justificada</span>`;
              }
              if (r.Justificado === 1 && r.Verificado === 0) {
                return `<span class="pendiente">📥 Justificación enviada</span>`;
              }
              if (!entradaReal && !salidaReal) {
                if (r.Justificado === 0) return `<span class="fuera">❌ Falta injustificada</span>`;
                else return `<span class="pendiente">⏳ En proceso</span>`;
              }
              if (entradaReal && salidaReal && esperado) {
                const entroDentro = esperado.some(h => {
                  const entEsperada = new Date(`${r.Fecha}T${h.entrada}`);
                  const salEsperada = new Date(`${r.Fecha}T${h.salida}`);
                  return entradaReal >= entEsperada && salidaReal <= salEsperada;
                });
                return entroDentro
                  ? `<span class="dentro">✅ Dentro del horario</span>`
                  : `<span class="fuera">🕐 Fuera de horario</span>`;
              }
              return `<span class="pendiente">SIN HORARIO</span>`;
            }

            const estado = interpretarEstado();

            return `
              <tr>
                <td>${formatFecha(r.Fecha)}</td>
                <td>${formatTime(r.Hora_Entrada)}</td>
                <td>${formatTime(r.Hora_Salida)}</td>
                <td>${estado}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <hr />
    `;
  }).join('')}
</body>
</html>
`;

    // 👇 Registro en la tabla reporte
    await pool.execute(
      `INSERT INTO reporte (Usuario, Fecha_Generacion, Fecha_Inicio, Fecha_Fin, Registros)
       VALUES (?, NOW(), ?, ?, ?)`,
      [usuario ?? 'TODOS', fechaInicio, fechaFin, rows.length]
    );

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Reporte_Asistencia.pdf`,
      },
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
