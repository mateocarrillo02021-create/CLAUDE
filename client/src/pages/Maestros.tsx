import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getAllMaestros, createMaestro, updateMaestro } from '../lib/api';
import { formatDate } from '../lib/utils';

interface MaestroForm {
  nombre: string;
  especialidad: string;
}

function MaestroModal({ maestro, onClose }: { maestro?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<MaestroForm>({
    nombre: maestro?.nombre || '',
    especialidad: maestro?.especialidad || '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) =>
      maestro ? updateMaestro(maestro.id, data) : createMaestro(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maestros-all'] });
      qc.invalidateQueries({ queryKey: ['maestros'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({
      nombre: form.nombre.trim(),
      especialidad: form.especialidad.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {maestro ? 'Editar Maestro' : 'Nuevo Maestro'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Maestro Aníbal"
              required
            />
          </div>
          <div>
            <label className="label">Especialidad (opcional)</label>
            <input
              className="input"
              value={form.especialidad}
              onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
              placeholder="Ej: Pintura y enderazado"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : maestro ? 'Actualizar' : 'Crear Maestro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Maestros() {
  const { canManageUsers } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editMaestro, setEditMaestro] = useState<any>(null);

  const { data: maestros = [], isLoading } = useQuery({
    queryKey: ['maestros-all'],
    queryFn: () => getAllMaestros().then((r) => r.data),
    enabled: canManageUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      updateMaestro(id, { activo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maestros-all'] });
      qc.invalidateQueries({ queryKey: ['maestros'] });
    },
  });

  if (!canManageUsers) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">🔒</div>
        <p>No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  const activos = maestros.filter((m: any) => m.activo);
  const inactivos = maestros.filter((m: any) => !m.activo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maestros</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activos.length} activo{activos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditMaestro(null); setShowModal(true); }}
          className="btn-primary"
        >
          + Nuevo Maestro
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando maestros...</div>
      ) : maestros.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">👷</div>
          <p className="text-lg font-medium">No hay maestros registrados</p>
          <p className="text-sm mt-1">Agrega maestros para asignarles arreglos de vehículos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Maestros Activos</h2>
            </div>
            {activos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No hay maestros activos</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Especialidad</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Registrado</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activos.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{m.nombre}</td>
                      <td className="px-6 py-3 text-gray-500">{m.especialidad || '-'}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(m.createdAt)}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => { setEditMaestro(m); setShowModal(true); }}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Desactivar a ${m.nombre}?`)) {
                                toggleMutation.mutate({ id: m.id, activo: false });
                              }
                            }}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Inactive */}
          {inactivos.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-500">Maestros Inactivos</h2>
              </div>
              <table className="w-full text-sm opacity-60">
                <tbody className="divide-y divide-gray-100">
                  {inactivos.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-500">{m.nombre}</td>
                      <td className="px-6 py-3 text-gray-400">{m.especialidad || '-'}</td>
                      <td className="px-6 py-3 text-gray-300 text-xs">{formatDate(m.createdAt)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => toggleMutation.mutate({ id: m.id, activo: true })}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Reactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <MaestroModal
          maestro={editMaestro}
          onClose={() => { setShowModal(false); setEditMaestro(null); }}
        />
      )}
    </div>
  );
}
