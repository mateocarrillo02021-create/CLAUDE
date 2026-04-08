import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
} from '../lib/api';
import {
  formatCurrency, formatDate, statusLabel, statusColor,
  prendasLabel, matriculacionLabel,
} from '../lib/utils';

interface VehicleFormData {
  placa: string;
  nombreCorto: string;
  precio: string;
  prendas: string;
  segundaLlave: string;
  revisionVehicular: string;
  matriculacion: string;
  anioMatriculacion: string;
  arreglosNecesarios: string;
  repuestosPorComprar: string;
  ubicacion: string;
  observaciones: string;
}

const defaultForm: VehicleFormData = {
  placa: '', nombreCorto: '', precio: '',
  prendas: 'no', segundaLlave: 'pendiente',
  revisionVehicular: 'pendiente', matriculacion: 'por_matricular',
  anioMatriculacion: '', arreglosNecesarios: '', repuestosPorComprar: '',
  ubicacion: '', observaciones: '',
};

function VehicleModal({
  vehicle, onClose,
}: {
  vehicle?: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<VehicleFormData>(
    vehicle
      ? {
          placa: vehicle.placa || '',
          nombreCorto: vehicle.nombreCorto || '',
          precio: vehicle.precio || '',
          prendas: vehicle.prendas || 'no',
          segundaLlave: vehicle.segundaLlave || 'pendiente',
          revisionVehicular: vehicle.revisionVehicular || 'pendiente',
          matriculacion: vehicle.matriculacion || 'por_matricular',
          anioMatriculacion: vehicle.anioMatriculacion ? String(vehicle.anioMatriculacion) : '',
          arreglosNecesarios: vehicle.arreglosNecesarios || '',
          repuestosPorComprar: vehicle.repuestosPorComprar || '',
          ubicacion: vehicle.ubicacion || '',
          observaciones: vehicle.observaciones || '',
        }
      : defaultForm
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) =>
      vehicle ? updateVehicle(vehicle.id, data) : createVehicle(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Error al guardar');
    },
  });

  const set = (field: keyof VehicleFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data: any = {
      ...form,
      precio: form.precio,
      anioMatriculacion: form.anioMatriculacion ? parseInt(form.anioMatriculacion) : null,
    };
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {vehicle ? 'Editar Vehículo' : 'Registrar Vehículo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mandatory fields */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Datos Obligatorios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Placa *</label>
                <input className="input" value={form.placa} onChange={set('placa')}
                  placeholder="Ej: ABC-1234" required style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="label">Precio Recibido *</label>
                <input className="input" type="number" step="0.01" value={form.precio}
                  onChange={set('precio')} placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="label">Nombre Corto (Marca, Modelo, Año, Color) *</label>
              <input className="input" value={form.nombreCorto} onChange={set('nombreCorto')}
                placeholder="Ej: Toyota Corolla 2020 Blanco" required />
            </div>
          </div>

          {/* Additional fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datos Adicionales</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Prendas</label>
                <select className="select" value={form.prendas} onChange={set('prendas')}>
                  <option value="no">No</option>
                  <option value="si_pendiente">Sí, pendiente</option>
                </select>
              </div>

              <div>
                <label className="label">Segunda Llave</label>
                <select className="select" value={form.segundaLlave} onChange={set('segundaLlave')}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="label">Revisión Vehicular</label>
                <select className="select" value={form.revisionVehicular} onChange={set('revisionVehicular')}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="label">Matriculación</label>
                <select className="select" value={form.matriculacion} onChange={set('matriculacion')}>
                  <option value="por_matricular">Por matricular</option>
                  <option value="matriculado">Matriculado</option>
                </select>
              </div>

              {form.matriculacion === 'matriculado' && (
                <div>
                  <label className="label">Año de Matriculación</label>
                  <input className="input" type="number" value={form.anioMatriculacion}
                    onChange={set('anioMatriculacion')} placeholder="2024" min="2000" max="2099" />
                </div>
              )}

              <div>
                <label className="label">Ubicación Actual</label>
                <input className="input" value={form.ubicacion} onChange={set('ubicacion')}
                  placeholder="Ej: Patio principal" />
              </div>
            </div>

            <div>
              <label className="label">Arreglos Necesarios</label>
              <textarea className="input" rows={3} value={form.arreglosNecesarios}
                onChange={set('arreglosNecesarios')}
                placeholder="Ej: Pintura y/o enderazado, cambiar repuestos..." />
            </div>

            <div>
              <label className="label">Compra de Repuestos (opcional)</label>
              <textarea className="input" rows={2} value={form.repuestosPorComprar}
                onChange={set('repuestosPorComprar')}
                placeholder="Ej: Volante, espejo retrovisor..." />
            </div>

            <div>
              <label className="label">Observaciones</label>
              <textarea className="input" rows={2} value={form.observaciones}
                onChange={set('observaciones')} placeholder="Observaciones generales..." />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : vehicle ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehicleDetail({ vehicle, onClose, onEdit }: { vehicle: any; onClose: () => void; onEdit: () => void }) {
  const { canSeePrice } = useAuth();
  const hasPendients = vehicle.arreglosNecesarios || vehicle.repuestosPorComprar;

  const fieldRow = (label: string, value: string, colorClass = '') => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">{vehicle.placa}</h2>
            <p className="text-sm text-gray-500">{vehicle.nombreCorto}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn-secondary text-sm py-1">Editar</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {hasPendients && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-800 uppercase mb-2">Pendientes</p>
              {vehicle.arreglosNecesarios && (
                <p className="text-sm text-yellow-700"><span className="font-medium">Arreglos:</span> {vehicle.arreglosNecesarios}</p>
              )}
              {vehicle.repuestosPorComprar && (
                <p className="text-sm text-yellow-700 mt-1"><span className="font-medium">Repuestos:</span> {vehicle.repuestosPorComprar}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado</p>
            <span className={`badge ${statusColor(vehicle.status)}`}>{statusLabel(vehicle.status)}</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Información</p>
            {canSeePrice && fieldRow('Precio', formatCurrency(vehicle.precio), 'text-green-700')}
            {fieldRow('Ubicación', vehicle.ubicacion || '-')}
            {fieldRow('Prendas', prendasLabel(vehicle.prendas))}
            {fieldRow('2da Llave', vehicle.segundaLlave)}
            {fieldRow('Revisión', vehicle.revisionVehicular)}
            {fieldRow('Matriculación', matriculacionLabel(vehicle.matriculacion, vehicle.anioMatriculacion))}
          </div>

          {vehicle.observaciones && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</p>
              <p className="text-sm text-gray-700">{vehicle.observaciones}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Registro</p>
            <p className="text-xs text-gray-400">Creado: {formatDate(vehicle.createdAt)}</p>
            <p className="text-xs text-gray-400">Actualizado: {formatDate(vehicle.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const { canEditVehicle } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [detailVehicle, setDetailVehicle] = useState<any>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', search],
    queryFn: () => getVehicles(search || undefined).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const { canSeePrice } = useAuth();

  const handleDelete = (v: any) => {
    if (confirm(`¿Eliminar el vehículo ${v.placa}?`)) {
      deleteMutation.mutate(v.id);
    }
  };

  const openEdit = (v: any) => {
    setDetailVehicle(null);
    setEditVehicle(v);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
        {canEditVehicle && (
          <button
            onClick={() => { setEditVehicle(null); setShowModal(true); }}
            className="btn-primary"
          >
            + Registrar Vehículo
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          className="input pl-10"
          placeholder="Buscar por placa o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando vehículos...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🚗</div>
          <p>No se encontraron vehículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => {
            const hasPendients = v.arreglosNecesarios || v.repuestosPorComprar;
            return (
              <div
                key={v.id}
                className={`card cursor-pointer hover:shadow-md transition-shadow relative ${hasPendients ? 'border-yellow-300' : ''}`}
                onClick={() => setDetailVehicle(v)}
              >
                {hasPendients && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-yellow-400 rounded-full" title="Tiene pendientes" />
                )}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{v.placa}</h3>
                    <p className="text-sm text-gray-600">{v.nombreCorto}</p>
                  </div>
                  <span className={`badge ${statusColor(v.status)}`}>
                    {statusLabel(v.status)}
                  </span>
                </div>

                {canSeePrice && (
                  <p className="text-green-700 font-semibold text-sm">{formatCurrency(v.precio)}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`badge text-xs ${statusColor(v.prendas)}`}>
                    Prendas: {prendasLabel(v.prendas)}
                  </span>
                  <span className={`badge text-xs ${statusColor(v.segundaLlave)}`}>
                    2da: {v.segundaLlave}
                  </span>
                  <span className={`badge text-xs ${statusColor(v.revisionVehicular)}`}>
                    Rev: {v.revisionVehicular}
                  </span>
                </div>

                {v.ubicacion && (
                  <p className="text-xs text-gray-400 mt-2">📍 {v.ubicacion}</p>
                )}

                {canEditVehicle && (
                  <div
                    className="flex gap-2 mt-3 pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => openEdit(v)} className="btn-secondary text-xs py-1 flex-1">Editar</button>
                    <button onClick={() => handleDelete(v)} className="btn-danger text-xs py-1 flex-1">Eliminar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => { setShowModal(false); setEditVehicle(null); }}
        />
      )}

      {detailVehicle && !showModal && (
        <VehicleDetail
          vehicle={detailVehicle}
          onClose={() => setDetailVehicle(null)}
          onEdit={() => openEdit(detailVehicle)}
        />
      )}
    </div>
  );
}
