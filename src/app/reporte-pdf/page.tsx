'use client';
import React, { useEffect, useState } from 'react';

interface Usuario {
  id: number;
  nombreCompleto: string;
}
const ReportePDF = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState('2024-12-31');
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  // Cargar usuarios desde la API cuando carga la página
  useEffect(() => {
    const cargarUsuarios = async () => {
      setCargandoUsuarios(true);
      try {
        const res = await fetch('/api/usuarios');
        if (!res.ok) throw new Error('Error cargando usuarios');
        const data: Usuario[] = await res.json();
        setUsuarios(data);
      } catch (error) {
        console.error(error);
        alert('No se pudieron cargar los usuarios');
      } finally {
        setCargandoUsuarios(false);
      }
    };
    cargarUsuarios();
  }, []);
  const handleGenerarReporte = async () => {
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      alert('La fecha fin no puede ser anterior a la fecha inicio');
      return;
    }
    try {
      const queryParams = new URLSearchParams({
        fechaInicio,
        fechaFin,
      });

      if (usuarioSeleccionado !== '') {
        queryParams.set('usuario', usuarioSeleccionado);
      }

      const response = await fetch(`/api/reporte-pdf?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const safeUsuario = usuarioSeleccionado === ''
        ? 'todos'
        : usuarioSeleccionado.replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      a.download = `reporte_asistencias_${safeUsuario}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      alert('Hubo un error al generar el reporte.');
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Página de Reportes PDF</h1>
      <p className="mb-4">Selecciona un usuario y rango de fechas para generar el reporte.</p>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Seleccionar usuario:</label>
        {cargandoUsuarios ? (
          <p>Cargando usuarios...</p>
        ) : (
          <select
            className="border rounded px-4 py-2 w-full"
            value={usuarioSeleccionado}
            onChange={(e) => setUsuarioSeleccionado(e.target.value)}
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.nombreCompleto}>
                {u.nombreCompleto}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium">Fecha inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Fecha fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border rounded px-4 py-2"
          />
        </div>
      </div>
      <button
        onClick={handleGenerarReporte}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
      >
        Generar reporte
      </button>
    </div>
  );
};
export default ReportePDF;
