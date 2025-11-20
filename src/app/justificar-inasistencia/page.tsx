'use client';

import { useEffect, useState } from 'react';

interface Justificacion {
  ID_Asistencia: number;
  Fecha: string;
  Asunto: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  Evidencia: string | null;
}

export default function JustificarInasistenciaPage() {
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/justificaciones');
        if (!res.ok) throw new Error('Error al cargar las justificaciones');
        const data = await res.json();
        setJustificaciones(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error desconocido');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const manejarAccion = async (id: number, action: 'aceptar' | 'rechazar') => {
    await fetch('/api/justificaciones', {
      method: 'POST',
      body: JSON.stringify({ id, action }),
    });

    setJustificaciones(justificaciones.filter((j) => j.ID_Asistencia !== id));
  };

  if (cargando) return <p className="p-6">Cargando solicitudes...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (justificaciones.length === 0) {
    return <p className="p-6 text-gray-600">No hay solicitudes de justificación pendientes.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Solicitudes de Justificación</h1>
      <ul className="space-y-4">
        {justificaciones.map((j) => (
          <li key={j.ID_Asistencia} className="bg-white p-4 shadow rounded-lg border border-blue-200">
            <p>
              <strong>Personal:</strong> {j.nombre} {j.apellidoPaterno} {j.apellidoMaterno}
            </p>
            <p>
              <strong>Fecha:</strong> {j.Fecha}
            </p>
            <p>
              <strong>Asunto:</strong> {j.Asunto}
            </p>
            {j.Evidencia && (
              <p>
                <strong>Evidencia:</strong>{' '}
                <a
                  href={`/evidencias/${j.Evidencia}`}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Ver archivo
                </a>
              </p>
            )}
            <div className="mt-3 space-x-2">
              <button
                onClick={() => manejarAccion(j.ID_Asistencia, 'aceptar')}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Aceptar
              </button>
              <button
                onClick={() => manejarAccion(j.ID_Asistencia, 'rechazar')}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
