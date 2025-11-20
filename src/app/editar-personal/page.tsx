'use client';

import { useEffect, useState } from 'react';

export default function EditarPersonal() {
  const [personal, setPersonal] = useState([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    rol: '',
    correo: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 5;

  const cargarDatos = async () => {
    const res = await fetch('/api/personal-academico');
    const data = await res.json();
    setPersonal(data.personal || []);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const iniciarEdicion = (persona: any) => {
    setEditando(persona.ID_Personal);
    setForm({
      nombre: persona.Nombre,
      apellidoPaterno: persona.Apellido_Paterno,
      apellidoMaterno: persona.Apellido_Materno,
      curp: persona.Curp,
      rol: persona.Rol,
      correo: persona.Correo,
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setForm({
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      curp: '',
      rol: '',
      correo: '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`/api/personal-academico/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMensaje(data.mensaje);
    cancelarEdicion();
    cargarDatos();
  };

  const eliminarPersonal = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    const res = await fetch(`/api/personal-academico/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    setMensaje(data.mensaje);
    cargarDatos();
  };

  const datosFiltrados = personal.filter((p: any) => {
    const termino = busqueda.toLowerCase();
    return (
      p.Nombre.toLowerCase().includes(termino) ||
      p.Apellido_Paterno.toLowerCase().includes(termino) ||
      p.Apellido_Materno.toLowerCase().includes(termino) ||
      p.Curp.toLowerCase().includes(termino) ||
      p.Correo.toLowerCase().includes(termino) ||
      p.Rol.toLowerCase().includes(termino)
    );
  });

  const totalPaginas = Math.ceil(datosFiltrados.length / porPagina);
  const inicio = (paginaActual - 1) * porPagina;
  const datosPagina = datosFiltrados.slice(inicio, inicio + porPagina);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Editar Personal Académico</h2>

      {mensaje && <p className="mb-4 text-green-600 font-medium">{mensaje}</p>}

      <input
        type="text"
        placeholder="Buscar por nombre, CURP, correo..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPaginaActual(1);
        }}
        className="mb-4 p-2 w-full border border-gray-300 rounded shadow-sm"
      />

      {editando !== null && (
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700">Editando registro</h3>
          {[
            { name: 'nombre', label: 'Nombre' },
            { name: 'apellidoPaterno', label: 'Apellido Paterno' },
            { name: 'apellidoMaterno', label: 'Apellido Materno' },
            { name: 'curp', label: 'CURP' },
            { name: 'rol', label: 'Rol' },
            { name: 'correo', label: 'Correo Electrónico' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <input
                name={name}
                value={(form as any)[name]}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 p-2 rounded shadow-sm"
              />
            </div>
          ))}

          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={cancelarEdicion}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded shadow-md overflow-hidden border border-gray-200">
        <thead className="bg-blue-100 text-blue-900">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">CURP</th>
            <th className="p-2 text-left">Rol</th>
            <th className="p-2 text-left">Correo</th>
            <th className="p-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datosPagina.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-500">No se encontraron resultados.</td>
            </tr>
          ) : (
            datosPagina.map((p: any) => (
              <tr key={p.ID_Personal} className="border-t hover:bg-gray-50">
                <td className="p-2">{`${p.Nombre} ${p.Apellido_Paterno} ${p.Apellido_Materno}`}</td>
                <td className="p-2">{p.Curp}</td>
                <td className="p-2">{p.Rol}</td>
                <td className="p-2">{p.Correo}</td>

                <td className="p-2 flex justify-center gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => iniciarEdicion(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => eliminarPersonal(p.ID_Personal)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 gap-4 text-sm">
          <button
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual(paginaActual - 1)}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-2">Página {paginaActual} de {totalPaginas}</span>
          <button
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual(paginaActual + 1)}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
