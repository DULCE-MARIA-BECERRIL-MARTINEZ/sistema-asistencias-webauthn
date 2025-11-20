'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistrarPersonal() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    rol: '',
    correo: '',
    idEscuela: null,
  });

  const [mensaje, setMensaje] = useState('');
  const [nuevoID, setNuevoID] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/personal-academico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMensaje(data.mensaje);

    if (data.success) {
      setNuevoID(data.idInsertado); // ⭐ Guardamos ID del usuario

      setForm({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        curp: '',
        rol: '',
        correo: '',
        idEscuela: null,
      });
    }
  };

  const registrarHuella = () => {
    if (!nuevoID) return;
    router.push(`/registrar-huella-personal/${nuevoID}`);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4">Registrar Personal Académico</h2>

      {mensaje && <p className="mb-4 text-green-600">{mensaje}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'nombre', label: 'Nombre' },
          { name: 'apellidoPaterno', label: 'Apellido Paterno' },
          { name: 'apellidoMaterno', label: 'Apellido Materno' },
          { name: 'curp', label: 'CURP' },
          { name: 'rol', label: 'Rol' },
          { name: 'correo', label: 'Correo Electrónico' },
        ].map(({ name, label }) => (
          <input
            key={name}
            name={name}
            placeholder={label}
            value={(form as any)[name]}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 p-2 rounded"
          />
        ))}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Registrar
        </button>
      </form>

      {/* BOTÓN APARECE SOLO SI YA SE REGISTRÓ EL PERSONAL */}
      {nuevoID && (
        <div className="mt-6 text-center">
          <button
            onClick={registrarHuella}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg shadow"
          >
            Registrar huella del usuario
          </button>
        </div>
      )}
    </div>
  );
}
