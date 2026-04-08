import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead, markAllRead } from '../lib/api';
import { formatDate } from '../lib/utils';

const notifIcons: Record<string, string> = {
  nueva_venta: '💰',
  arreglo_completado: '✅',
  nuevo_abono: '💳',
  alerta: '⚠️',
};

const notifColors: Record<string, string> = {
  nueva_venta: 'border-green-200 bg-green-50',
  arreglo_completado: 'border-blue-200 bg-blue-50',
  nuevo_abono: 'border-purple-200 bg-purple-50',
  alerta: 'border-yellow-200 bg-yellow-50',
};

export default function Notifications() {
  const { canSeeNotifications } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then((r) => r.data),
    enabled: canSeeNotifications,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  if (!canSeeNotifications) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">🔔</div>
        <p>No tienes acceso a las notificaciones</p>
      </div>
    );
  }

  const unread = notifications.filter((n: any) => !n.leida);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {unread.length > 0 && (
            <p className="text-sm text-gray-500">{unread.length} sin leer</p>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="btn-secondary text-sm"
            disabled={markAllMutation.isPending}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando notificaciones...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-lg font-medium">Sin notificaciones</p>
          <p className="text-sm mt-1">Las nuevas notificaciones aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 transition-all ${
                notifColors[n.tipo] || 'border-gray-200 bg-white'
              } ${!n.leida ? 'shadow-sm' : 'opacity-70'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{notifIcons[n.tipo] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.leida ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {n.mensaje}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.leida && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                    disabled={markReadMutation.isPending}
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
