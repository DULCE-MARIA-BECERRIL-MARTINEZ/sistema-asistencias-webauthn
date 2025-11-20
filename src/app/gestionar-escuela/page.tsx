'use client';

import { useEffect, useState } from 'react';

interface Escuela {
  ID_Escuela: number;
  Nombre: string;
  Direccion: string;
  Clave_CCT: string;
}

const GestionarEscuela = () => {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [formData, setFormData] = useState<Escuela>({
    ID_Escuela: 0,
    Nombre: '',
    Direccion: '',
    Clave_CCT: '',
  });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarEscuelas = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/escuelas');
      const data = await res.json();
      setEscuelas(data);
    } catch {
      setError('Error al cargar escuelas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEscuelas();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const crearOActualizarEscuela = async () => {
    const { Nombre, Direccion, Clave_CCT } = formData;
    if (!Nombre || !Direccion || !Clave_CCT) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      setCargando(true);
      if (editandoId) {
        await fetch('/api/escuelas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editandoId,
            nombre: Nombre,
            direccion: Direccion,
            cct: Clave_CCT,
          }),
        });
      } else {
        await fetch('/api/escuelas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: Nombre,
            direccion: Direccion,
            cct: Clave_CCT,
          }),
        });
      }

      setFormData({ ID_Escuela: 0, Nombre: '', Direccion: '', Clave_CCT: '' });
      setEditandoId(null);
      await cargarEscuelas();
    } catch {
      setError('Error al guardar');
    } finally {
      setCargando(false);
    }
  };

  const eliminarEscuela = async (id: number) => {
    if (!confirm('¿Eliminar esta escuela?')) return;
    try {
      await fetch('/api/escuelas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await cargarEscuelas();
    } catch {
      alert('Error al eliminar');
    }
  };

  const iniciarEdicion = (escuela: Escuela) => {
    setEditandoId(escuela.ID_Escuela);
    setFormData(escuela);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData({ ID_Escuela: 0, Nombre: '', Direccion: '', Clave_CCT: '' });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">📚 Gestión de Escuelas</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          name="Nombre"
          placeholder="Nombre"
          value={formData.Nombre}
          onChange={handleInput}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="Direccion"
          placeholder="Dirección"
          value={formData.Direccion}
          onChange={handleInput}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="Clave_CCT"
          placeholder="Clave CCT"
          value={formData.Clave_CCT}
          onChange={handleInput}
          className="border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={crearOActualizarEscuela}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
        >
          {editandoId ? 'Actualizar' : 'Registrar'}
        </button>
        {editandoId && (
          <button
            onClick={cancelarEdicion}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
        )}
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-blue-100 text-left">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Nombre</th>
            <th className="p-2">Dirección</th>
            <th className="p-2">CCT</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {escuelas.map((e, index) => (
            <tr key={e.ID_Escuela} className="border-t">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{e.Nombre}</td>
              <td className="p-2">{e.Direccion}</td>
              <td className="p-2">{e.Clave_CCT}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => iniciarEdicion(e)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminarEscuela(e.ID_Escuela)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionarEscuela;
