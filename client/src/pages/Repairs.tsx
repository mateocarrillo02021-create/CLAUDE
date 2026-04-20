import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getRepairs, createRepair, updateRepair, deleteRepair, getVehicles, getMaestros } from '../lib/api';
import { formatDate, formatElapsedTime, statusColor } from '../lib/utils';

function RepairModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [maestroId, setMaestroId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pendientesSeleccionados, setPendientesSeleccionados] = useState('');
  const [error, setError] = useState('');

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles().then((r) => r.data),
  });

  const { data: maestros = [] } = useQuery({
    queryKey: ['maestros'],
    queryFn: () => getMaestros().then((r) => r.data),
  });

  const selectedVehicle = vehicles.find((v: any) => v.id === parseInt(vehicleId));
  const arregloItems = selectedVehicle?.arreglosNecesarios
    ? selectedVehicle.arreglosNecesarios
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const mutation = useMutation({
    mutationFn: (data: any) => createRepair(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repairs'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Error al registrar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({
      vehicleId: parseInt(vehicleId),
      maestroId: parseInt(maestroId),
      descripcion: descripcion || null,
      pendientesSeleccionados: pendientesSeleccionados || null,
    });
  };

  const availableVehicles = vehicles.filter((v: any) => v.status !== 'vendido');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Asignar Arreglo a Maestro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Vehículo *</label>
            <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
              <option value="">Seleccionar vehículo...</option>
              {availableVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.nombreCorto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Maestro *</label>
            <select className="select" value={maestroId} onChange={(e) => setMaestroId(e.target.value)} required>
              <option value="">Seleccionar maestro...</option>
              {maestros.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}{m.especialidad ? ` (${m.especialidad})` : ''}
                </option>
              ))}
            </select>
          </div>

          {arregloItems.length > 0 && (
            <div>
              <label className="label">Pendientes del Vehículo (seleccionar)</label>
              <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-36 overflow-y-auto">
                {arregloItems.map((item: string, i: number) => {
                  const trimmed = item.trim();
                  const selected = pendientesSeleccionados.includes(trimmed);
                  return (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendientesSeleccionados(
                              pendientesSeleccionados
                                ? `${pendientesSeleccionados}, ${trimmed}`
                                : trimmed
                            );
                          } else {
                            setPendientesSeleccionados(
                              pendientesSeleccionados
                                .split(', ')
                                .filter((x) => x !== trimmed)
                                .join(', ')
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{trimmed}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="label">Descripción del Trabajo (opcional)</label>
            <textarea
              className="input" rows={3} value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Pintar capó y guardachoque delantero..."
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar Arreglo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Repairs() {
  const { canManageRepairs } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('en_proceso');

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: () => getRepairs().then((r) => r.data),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateRepair(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repairs'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRepair(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repairs'] }),
  });

  const filtered = filter === 'all'
    ? repairs
    : repairs.filter((r: any) => r.repair?.status === filter);

  const handleComplete = (r: any) => {
    if (confirm('¿Marcar este arreglo como completado?')) {
      updateMutation.mutate({ id: r.repair.id, data: { status: 'completado' } });
    }
  };

  const handleCancel = (r: any) => {
    if (confirm('¿Cancelar este arreglo?')) {
      updateMutation.mutate({ id: r.repair.id, data: { status: 'cancelado' } });
    }
  };

  const handleDelete = (r: any) => {
    if (confirm('¿Eliminar este arreglo?')) {
      deleteMutation.mutate(r.repair.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Arreglos</h1>
        {canManageRepairs && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Asignar Arreglo
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'en_proceso', label: 'En Proceso' },
          { key: 'completado', label: 'Completados' },
          { key: 'cancelado', label: 'Cancelados' },
          { key: 'all', label: 'Todos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-75">
              ({repairs.filter((r: any) => f.key === 'all' || r.repair?.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando arreglos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🔧</div>
          <p>No hay arreglos en este estado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => {
            const isActive = r.repair?.status === 'en_proceso';
            const elapsed = formatElapsedTime(r.repair?.assignedAt);
            return (
              <div key={r.repair?.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{r.vehicle?.placa}</h3>
                      <span className="text-gray-500 text-sm">{r.vehicle?.nombreCorto}</span>
                      <span className={`badge ${statusColor(r.repair?.status)}`}>
                        {r.repair?.status === 'en_proceso' ? 'En Proceso' : r.repair?.status === 'completado' ? 'Completado' : 'Cancelado'}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-sm text-gray-600">
                      <span>👷 {r.maestro?.nombre}</span>
                      {r.maestro?.especialidad && (
                        <span className="text-gray-400">· {r.maestro.especialidad}</span>
                      )}
                    </div>

                    {r.repair?.pendientesSeleccionados && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Pendientes:</span> {r.repair.pendientesSeleccionados}
                      </p>
                    )}

                    {r.repair?.descripcion && (
                      <p className="text-sm text-gray-500 mt-1 italic">"{r.repair.descripcion}"</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Iniciado: {formatDate(r.repair?.assignedAt)}</span>
                      {r.repair?.completedAt && (
                        <span>Completado: {formatDate(r.repair.completedAt)}</span>
                      )}
                    </div>
                    {isActive && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1 text-xs text-orange-700 font-medium">
                        ⏱ {elapsed} en proceso con {r.maestro?.nombre}
                      </div>
                    )}
                  </div>

                  {canManageRepairs && isActive && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => handleComplete(r)} className="btn-success text-xs py-1 px-3">
                        Completar
                      </button>
                      <button onClick={() => handleCancel(r)} className="btn-secondary text-xs py-1 px-3">
                        Cancelar
                      </button>
                      <button onClick={() => handleDelete(r)} className="btn-danger text-xs py-1 px-3">
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <RepairModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
