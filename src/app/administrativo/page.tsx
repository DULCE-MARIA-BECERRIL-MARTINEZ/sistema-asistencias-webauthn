'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Administrativo {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  rol?: string;
  tipo?: string;
}

const PanelAdministrativo = () => {
  const [administrativo, setAdministrativo] = useState<Administrativo | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('usuario');
      if (stored) {
        const data: Administrativo = JSON.parse(stored);
        if (data.tipo === 'administrativo') {
          setAdministrativo(data);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error al leer los datos de localStorage:', error);
      router.push('/login');
    } finally {
      setCargando(false);
    }
  }, [router]);

  if (cargando) {
    return <p className="text-center text-gray-500 mt-10">Cargando datos administrativos...</p>;
  }

  if (!administrativo) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-6 flex flex-col justify-between">
      {/* Mensaje de Bienvenida */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-blue-900">
          Bienvenido, Administrativo
        </h2>
        <p className="text-lg text-blue-800 mt-1">
          {administrativo.nombre} {administrativo.apellidoPaterno} {administrativo.apellidoMaterno}
        </p>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo del sistema" className="w-24 h-auto mb-4" />
          <h1 className="text-4xl font-bold text-blue-800">Panel Administrativo</h1>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 mb-8 text-blue-900 shadow-sm">
          <p>
            <strong>Nombre:</strong> {administrativo.nombre || '(sin nombre)'}
          </p>
          <p>
            <strong>ID:</strong> {administrativo.id || '(sin identificación)'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <ActionCard title="Registrar Personal Académico" link="/registrar-personal" />
  <ActionCard title="Editar Datos de Personal" link="/editar-personal" />
  <ActionCard title="Asignar Horario" link="/horario" />
  <ActionCard title="Justificar Inasistencia" link="/justificar-inasistencia" />
  <ActionCard title="Ver Reportes" link="/reporte-pdf" />
  <ActionCard title="Gestionar Escuela" link="/gestionar-escuela" />
  <ActionCard title="Asignar Docente a Escuela" link="/docente-escuela" /> {/* Este es el nuevo */}
</div>

      </div>

      <div className="max-w-6xl mx-auto mt-10 mb-6 text-right">
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow"
          onClick={() => {
            localStorage.removeItem('usuario');
            router.push('/login');
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  link?: string;
}

const ActionCard = ({ title, link }: ActionCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (link) {
      router.push(link);
    } else {
      alert(`${title} presionado`);
    }
  };

  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-md text-center text-lg font-semibold transition-all duration-300"
      onClick={handleClick}
    >
      {title}
    </button>
  );
};

export default PanelAdministrativo;
