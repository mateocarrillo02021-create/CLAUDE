import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getVehicles, getRepairs, getSales, getNotifications } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

export default function Dashboard() {
  const { user, canSeePrice, canManageRepairs, canManageSales, canSeeNotifications } = useAuth();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => getVehicles().then((r) => r.data),
  });

  const { data: repairs = [] } = useQuery({
    queryKey: ['repairs'],
    queryFn: () => getRepairs().then((r) => r.data),
    enabled: canManageRepairs,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => getSales().then((r) => r.data),
    enabled: canManageSales,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then((r) => r.data),
    enabled: canSeeNotifications,
  });

  const availableVehicles = vehicles.filter((v: any) => v.status === 'disponible');
  const inRepairVehicles = vehicles.filter((v: any) => v.status === 'en_arreglo');
  const soldVehicles = vehicles.filter((v: any) => v.status === 'vendido');
  const activeRepairs = repairs.filter((r: any) => r.repair?.status === 'en_proceso');
  const activeSales = sales.filter((s: any) => s.sale?.tipo === 'credito');
  const unreadNotifs = notifications.filter((n: any) => !n.leida);

  const stats = [
    { label: 'Total Vehículos', value: vehicles.length, color: 'bg-blue-500', to: '/vehicles' },
    { label: 'Disponibles', value: availableVehicles.length, color: 'bg-green-500', to: '/vehicles' },
    { label: 'En Arreglo', value: inRepairVehicles.length, color: 'bg-yellow-500', to: canManageRepairs ? '/repairs' : '/vehicles' },
    { label: 'Vendidos', value: soldVehicles.length, color: 'bg-gray-500', to: '/vehicles' },
  ];

  if (canManageRepairs) {
    stats.push({ label: 'Arreglos Activos', value: activeRepairs.length, color: 'bg-orange-500', to: '/repairs' });
  }
  if (canManageSales) {
    stats.push({ label: 'Ventas a Crédito', value: activeSales.length, color: 'bg-purple-500', to: '/sales' });
  }
  if (canSeeNotifications) {
    stats.push({ label: 'Notificaciones', value: unreadNotifs.length, color: 'bg-red-500', to: '/notifications' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="card hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-lg">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent vehicles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Vehículos Recientes</h2>
            <Link to="/vehicles" className="text-blue-600 text-sm hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {vehicles.slice(0, 5).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-sm">{v.placa}</span>
                  <span className="text-gray-500 text-xs ml-2">{v.nombreCorto}</span>
                </div>
                <div className="flex items-center gap-2">
                  {canSeePrice && (
                    <span className="text-xs font-medium text-green-700">{formatCurrency(v.precio)}</span>
                  )}
                  <span className={`badge ${v.status === 'disponible' ? 'bg-green-100 text-green-800' : v.status === 'en_arreglo' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {v.status === 'disponible' ? 'Disp.' : v.status === 'en_arreglo' ? 'Arreglo' : 'Vendido'}
                  </span>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No hay vehículos registrados</p>
            )}
          </div>
        </div>

        {/* Active repairs or notifications */}
        {canManageRepairs && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Arreglos Activos</h2>
              <Link to="/repairs" className="text-blue-600 text-sm hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {activeRepairs.slice(0, 5).map((r: any) => (
                <div key={r.repair.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{r.vehicle?.placa}</span>
                    <span className="text-xs text-gray-500">{r.maestro?.nombre}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.vehicle?.nombreCorto}</p>
                </div>
              ))}
              {activeRepairs.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No hay arreglos activos</p>
              )}
            </div>
          </div>
        )}

        {canSeeNotifications && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Notificaciones Recientes</h2>
              <Link to="/notifications" className="text-blue-600 text-sm hover:underline">Ver todas</Link>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className={`py-2 border-b border-gray-100 last:border-0 ${!n.leida ? 'font-medium' : ''}`}>
                  <p className="text-sm">{n.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No hay notificaciones</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
