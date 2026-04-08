import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getSales, getSale, createSale, createAbono, getVehicles } from '../lib/api';
import { formatCurrency, formatDate, statusColor } from '../lib/utils';

function SaleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [vehicleId, setVehicleId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [tipo, setTipo] = useState<'contado' | 'credito'>('contado');
  const [precioVenta, setPrecioVenta] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [periodoPago, setPeriodoPago] = useState('mensual');
  const [error, setError] = useState('');

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles().then((r) => r.data),
  });

  const availableVehicles = vehicles.filter((v: any) => v.status === 'disponible');

  const mutation = useMutation({
    mutationFn: (data: any) => createSale(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
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
      clienteNombre: clienteNombre || null,
      tipo,
      precioVenta,
      montoPagado: montoPagado || '0',
      periodoPago: tipo === 'credito' ? periodoPago : null,
    });
  };

  const selectedVehicle = vehicles.find((v: any) => v.id === parseInt(vehicleId));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registrar Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Vehículo *</label>
            <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
              <option value="">Seleccionar vehículo disponible...</option>
              {availableVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.nombreCorto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nombre del Cliente</label>
            <input className="input" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="Nombre del comprador" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de Venta *</label>
              <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as any)} required>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            <div>
              <label className="label">Precio de Venta *</label>
              <input className="input" type="number" step="0.01" value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          {tipo === 'credito' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Monto Inicial Pagado</label>
                  <input className="input" type="number" step="0.01" value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Período de Pago</label>
                  <select className="select" value={periodoPago} onChange={(e) => setPeriodoPago(e.target.value)}>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AbonoModal({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => createAbono(saleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['sale', saleId] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Error al registrar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({ monto, notas: notas || null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registrar Abono</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Monto del Abono *</label>
            <input className="input" type="number" step="0.01" value={monto}
              onChange={(e) => setMonto(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <label className="label">Notas (opcional)</label>
            <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Referencia de pago..." />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SaleDetail({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const { canManageSales } = useAuth();
  const [showAbono, setShowAbono] = useState(false);

  const { data } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => getSale(saleId).then((r) => r.data),
  });

  if (!data) return null;
  const { sale, vehicle, abonos = [] } = data;
  const saldo = parseFloat(sale.precioVenta) - parseFloat(sale.montoPagado);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">Venta #{sale.id}</h2>
            <p className="text-sm text-gray-500">{vehicle?.nombreCorto}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Placa</p>
              <p className="font-medium">{vehicle?.placa}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium">{sale.clienteNombre || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tipo</p>
              <span className={`badge ${statusColor(sale.tipo)}`}>{sale.tipo === 'contado' ? 'Contado' : 'Crédito'}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="font-medium text-sm">{formatDate(sale.createdAt)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Precio de Venta</span>
              <span className="font-semibold">{formatCurrency(sale.precioVenta)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto Pagado</span>
              <span className="font-semibold text-green-700">{formatCurrency(sale.montoPagado)}</span>
            </div>
            {sale.tipo === 'credito' && (
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-sm font-medium text-gray-700">Saldo Pendiente</span>
                <span className={`font-bold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(saldo)}
                </span>
              </div>
            )}
            {sale.periodoPago && (
              <p className="text-xs text-gray-400">Pago {sale.periodoPago}</p>
            )}
          </div>

          {sale.tipo === 'credito' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Historial de Abonos</h3>
                {canManageSales && saldo > 0 && (
                  <button onClick={() => setShowAbono(true)} className="btn-primary text-xs py-1">
                    + Abono
                  </button>
                )}
              </div>
              {abonos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Sin abonos registrados</p>
              ) : (
                <div className="space-y-2">
                  {abonos.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(a.monto)}</p>
                        {a.notas && <p className="text-xs text-gray-400">{a.notas}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAbono && <AbonoModal saleId={saleId} onClose={() => setShowAbono(false)} />}
    </div>
  );
}

export default function Sales() {
  const { canManageSales } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [detailSaleId, setDetailSaleId] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => getSales().then((r) => r.data),
  });

  const filtered = filter === 'all' ? sales : sales.filter((s: any) => s.sale?.tipo === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        {canManageSales && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Registrar Venta
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'contado', label: 'Contado' },
          { key: 'credito', label: 'Crédito' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando ventas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">💰</div>
          <p>No hay ventas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const saldo = parseFloat(s.sale?.precioVenta || '0') - parseFloat(s.sale?.montoPagado || '0');
            return (
              <div
                key={s.sale?.id}
                className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetailSaleId(s.sale?.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{s.vehicle?.placa}</span>
                      <span className="text-gray-500 text-sm">{s.vehicle?.nombreCorto}</span>
                      <span className={`badge ${statusColor(s.sale?.tipo)}`}>
                        {s.sale?.tipo === 'contado' ? 'Contado' : 'Crédito'}
                      </span>
                    </div>
                    {s.sale?.clienteNombre && (
                      <p className="text-sm text-gray-600 mt-0.5">Cliente: {s.sale.clienteNombre}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(s.sale?.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(s.sale?.precioVenta)}</p>
                    {s.sale?.tipo === 'credito' && (
                      <p className={`text-sm font-medium ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {saldo > 0 ? `Debe: ${formatCurrency(saldo)}` : 'Pagado ✓'}
                      </p>
                    )}
                    {s.vendedor && (
                      <p className="text-xs text-gray-400">{s.vendedor.name}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <SaleModal onClose={() => setShowModal(false)} />}
      {detailSaleId && <SaleDetail saleId={detailSaleId} onClose={() => setDetailSaleId(null)} />}
    </div>
  );
}
