'use client';
import { useEffect, useState } from 'react';

type Horario = {
  ID_Horario: number;
  ID_Personal: number;
  Dia_Semana: string;
  Hora_Entrada_Esperada: string;
  Hora_Salida_Esperada: string;
  Nombre?: string;
  Apellido_Paterno?: string;
  Apellido_Materno?: string;
};

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

// Diccionario para mostrar los días con mayúscula
const DIAS_FORMATO: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

// Normaliza el nombre del día (quita tildes y pasa a minúscula)
function normalizarDia(dia: string): string {
  return dia
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export default function HorarioPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [formData, setFormData] = useState({
    ID_Personal: '',
    Dia_Semana: DIAS_SEMANA[0],
    Hora_Entrada_Esperada: '',
    Hora_Salida_Esperada: '',
  });
  const [editId, setEditId] = useState<number | null>(null);

  const fetchHorarios = async () => {
    try {
      const res = await fetch('/api/horarios');
      if (!res.ok) throw new Error('Error al cargar horarios');
      const data = await res.json();
      setHorarios(data);
    } catch (error) {
      console.error('fetchHorarios error:', error);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normaliza el nombre del día para evitar inconsistencias
    const diaCapitalizado =
      formData.Dia_Semana.charAt(0).toUpperCase() + formData.Dia_Semana.slice(1).toLowerCase();

    const payload = {
      ...formData,
      Dia_Semana: diaCapitalizado,
      ID_Personal: Number(formData.ID_Personal),
    };

    try {
      const url = editId ? `/api/horario/${editId}` : '/api/horario';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormData({
          ID_Personal: '',
          Dia_Semana: DIAS_SEMANA[0],
          Hora_Entrada_Esperada: '',
          Hora_Salida_Esperada: '',
        });
        setEditId(null);
        fetchHorarios();
      } else {
        console.error('Error al guardar horario');
      }
    } catch (error) {
      console.error('handleSubmit error:', error);
    }
  };

  const handleEdit = (horario: Horario) => {
    setEditId(horario.ID_Horario);
    setFormData({
      ID_Personal: String(horario.ID_Personal),
      Dia_Semana: horario.Dia_Semana,
      Hora_Entrada_Esperada: horario.Hora_Entrada_Esperada.slice(0, 5),
      Hora_Salida_Esperada: horario.Hora_Salida_Esperada.slice(0, 5),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este horario?')) return;
    try {
      const res = await fetch(`/api/horario/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (editId === id) {
          setEditId(null);
          setFormData({
            ID_Personal: '',
            Dia_Semana: DIAS_SEMANA[0],
            Hora_Entrada_Esperada: '',
            Hora_Salida_Esperada: '',
          });
        }
        fetchHorarios();
      } else {
        console.error('Error al eliminar horario');
      }
    } catch (error) {
      console.error('handleDelete error:', error);
    }
  };

  // Agrupar por persona → días normalizados
  const groupedHorarios = horarios.reduce((acc, curr) => {
    const personaKey = curr.ID_Personal;
    const diaKey = normalizarDia(curr.Dia_Semana);

    if (!acc[personaKey]) {
      acc[personaKey] = {
        ID_Personal: curr.ID_Personal,
        Nombre: curr.Nombre,
        Apellido_Paterno: curr.Apellido_Paterno,
        Apellido_Materno: curr.Apellido_Materno,
        dias: {},
      };
    }

    if (!acc[personaKey].dias[diaKey]) {
      acc[personaKey].dias[diaKey] = [];
    }

    acc[personaKey].dias[diaKey].push({
      ID_Horario: curr.ID_Horario,
      entrada: curr.Hora_Entrada_Esperada,
      salida: curr.Hora_Salida_Esperada,
    });

    return acc;
  }, {} as Record<
    number,
    {
      ID_Personal: number;
      Nombre?: string;
      Apellido_Paterno?: string;
      Apellido_Materno?: string;
      dias: Record<string, { ID_Horario: number; entrada: string; salida: string }[]>;
    }
  >);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Asignar horario</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-8">
        <input
          name="ID_Personal"
          placeholder="ID Personal"
          value={formData.ID_Personal}
          onChange={handleChange}
          required
          className="border p-2"
          type="number"
          min={1}
        />
        <select
          name="Dia_Semana"
          value={formData.Dia_Semana}
          onChange={handleChange}
          className="border p-2"
          required
        >
          {DIAS_SEMANA.map((dia) => (
            <option key={dia} value={dia}>
              {dia}
            </option>
          ))}
        </select>
        <input
          name="Hora_Entrada_Esperada"
          type="time"
          value={formData.Hora_Entrada_Esperada}
          onChange={handleChange}
          required
          className="border p-2"
        />
        <input
          name="Hora_Salida_Esperada"
          type="time"
          value={formData.Hora_Salida_Esperada}
          onChange={handleChange}
          required
          className="border p-2"
        />
        <button
          type="submit"
          className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          {editId ? 'Actualizar horario' : 'Guardar horario'}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Horarios asignados</h2>

      {horarios.length === 0 ? (
        <p>No hay horarios asignados.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedHorarios).map(([key, persona]) => (
            <div key={key} className="border p-4 rounded shadow">
              <p className="font-semibold text-lg mb-2">
                {persona.Nombre ?? '—'} {persona.Apellido_Paterno ?? ''} {persona.Apellido_Materno ?? ''}
              </p>
              {Object.entries(persona.dias).map(([dia, bloques]) => (
                <div key={dia} className="mb-3">
                  <h4 className="font-semibold">{DIAS_FORMATO[dia] ?? dia}</h4>
                  {bloques.map((bloque) => (
                    <div
                      key={bloque.ID_Horario}
                      className="flex justify-between items-center border-b pb-1"
                    >
                      <span>
                        {bloque.entrada.slice(0, 5)} - {bloque.salida.slice(0, 5)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleEdit(horarios.find((h) => h.ID_Horario === bloque.ID_Horario)!)
                          }
                          className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(bloque.ID_Horario)}
                          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
