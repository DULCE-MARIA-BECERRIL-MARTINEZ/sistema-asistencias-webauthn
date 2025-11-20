'use client';
import { useEffect, useState } from 'react';

interface Relacion {
  ID: number;
  Docente: string;
  Escuela: string;
  Hora_Entrada: string;
  Hora_Salida: string;
  Dias: string;
}

interface Docente {
  ID_Personal: number;
  Nombre: string;
  Apellido_Paterno: string;
  Apellido_Materno: string;
}

interface Escuela {
  ID_Escuela: number;
  Nombre: string;
}

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const GestionarDocenteEscuela = () => {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [formData, setFormData] = useState({
    ID_Personal: '',
    ID_Escuela: '',
    Hora_Entrada: '',
    Hora_Salida: '',
  });
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarTodo = async () => {
    try {
      const [rel, docsRes, escs] = await Promise.all([
        fetch('/api/docente-escuela').then(res => res.json()),
        fetch('/api/personal-academico').then(res => res.json()),
        fetch('/api/escuelas').then(res => res.json()),
      ]);

      setRelaciones(rel);
      setDocentes(docsRes.personal);
      setEscuelas(escs);
    } catch {
      setError('Error al cargar datos');
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleDia = (dia: string) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const asignarDocente = async () => {
    const { ID_Personal, ID_Escuela, Hora_Entrada, Hora_Salida } = formData;

    if (!ID_Personal || !ID_Escuela || !Hora_Entrada || !Hora_Salida || diasSeleccionados.length === 0) {
      alert('Todos los campos son obligatorios, incluyendo días');
      return;
    }

    try {
      await fetch('/api/docente-escuela', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ID_Personal: parseInt(ID_Personal),
          ID_Escuela: parseInt(ID_Escuela),
          Hora_Entrada,
          Hora_Salida,
          Dias: diasSeleccionados.join(','),
        }),
      });

      setFormData({
        ID_Personal: '',
        ID_Escuela: '',
        Hora_Entrada: '',
        Hora_Salida: '',
      });
      setDiasSeleccionados([]);
      setMensaje('Asignación registrada con éxito');
      setError(null);
      cargarTodo();
    } catch {
      setError('Error al asignar');
      setMensaje(null);
    }
  };

  const eliminarAsignacion = async (id: number) => {
    if (!confirm('¿Eliminar esta asignación?')) return;

    try {
      const res = await fetch('/api/docente-escuela', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error('No se pudo eliminar');
      }

      setMensaje('Asignación eliminada');
      setError(null);
      cargarTodo();
    } catch {
      setError('Error al eliminar');
      setMensaje(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow mt-8">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">👩‍🏫 Asignar Docentes a Escuelas</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {mensaje && <p className="text-green-600 mb-4">{mensaje}</p>}

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <select
          name="ID_Personal"
          value={formData.ID_Personal}
          onChange={handleInput}
          className="border rounded px-3 py-2"
        >
          <option value="">Seleccionar Docente</option>
          {docentes.map(d => (
            <option key={d.ID_Personal} value={d.ID_Personal}>
              {d.Nombre} {d.Apellido_Paterno} {d.Apellido_Materno}
            </option>
          ))}
        </select>

        <select
          name="ID_Escuela"
          value={formData.ID_Escuela}
          onChange={handleInput}
          className="border rounded px-3 py-2"
        >
          <option value="">Seleccionar Escuela</option>
          {escuelas.map(e => (
            <option key={e.ID_Escuela} value={e.ID_Escuela}>
              {e.Nombre}
            </option>
          ))}
        </select>

        <input
          type="time"
          name="Hora_Entrada"
          value={formData.Hora_Entrada}
          onChange={handleInput}
          className="border rounded px-3 py-2"
        />
        <input
          type="time"
          name="Hora_Salida"
          value={formData.Hora_Salida}
          onChange={handleInput}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Selección de días */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Días de la semana:</label>
        <div className="flex flex-wrap gap-3">
          {diasSemana.map(dia => (
            <label key={dia} className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={diasSeleccionados.includes(dia)}
                onChange={() => toggleDia(dia)}
                className="cursor-pointer"
              />
              <span>{dia}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={asignarDocente}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow"
      >
        Asignar
      </button>

      {/* Tabla */}
      <table className="w-full mt-8 border border-gray-300 text-left text-sm">
        <thead className="bg-indigo-100">
          <tr>
            <th className="p-2 border-r">#</th>
            <th className="p-2 border-r">Docente</th>
            <th className="p-2 border-r">Escuela</th>
            <th className="p-2 border-r">Entrada</th>
            <th className="p-2 border-r">Salida</th>
            <th className="p-2 border-r">Días</th>
            <th className="p-2 border-r">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {relaciones.map((r, i) => (
            <tr key={r.ID} className="border-t hover:bg-indigo-50">
              <td className="p-2 border-r">{i + 1}</td>
              <td className="p-2 border-r">{r.Docente}</td>
              <td className="p-2 border-r">{r.Escuela}</td>
              <td className="p-2 border-r">{r.Hora_Entrada}</td>
              <td className="p-2 border-r">{r.Hora_Salida}</td>
              <td className="p-2 border-r">{r.Dias}</td>
              <td className="p-2 border-r">
                <button
                  onClick={() => eliminarAsignacion(r.ID)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {relaciones.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center p-4 text-gray-500">
                No hay asignaciones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GestionarDocenteEscuela;
