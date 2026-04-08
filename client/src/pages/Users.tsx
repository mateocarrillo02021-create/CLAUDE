import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../lib/api';
import { formatDate, roleLabel } from '../lib/utils';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: string;
  active: boolean;
}

function UserModal({ user, onClose }: { user?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<UserFormData>({
    username: user?.username || '',
    password: '',
    name: user?.name || '',
    role: user?.role || 'vendedor',
    active: user?.active ?? true,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => user ? updateUser(user.id, data) : createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Error al guardar'),
  });

  const set = (field: keyof UserFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data: any = { username: form.username, name: form.name, role: form.role, active: form.active };
    if (form.password) data.password = form.password;
    if (!user && !form.password) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre Completo *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="Nombre del usuario" required />
          </div>
          <div>
            <label className="label">Nombre de Usuario *</label>
            <input className="input" value={form.username} onChange={set('username')} placeholder="usuario123" required />
          </div>
          <div>
            <label className="label">{user ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input className="input" type="password" value={form.password} onChange={set('password')}
              placeholder="••••••••" required={!user} />
          </div>
          <div>
            <label className="label">Rol *</label>
            <select className="select" value={form.role} onChange={set('role')}>
              <option value="admin">Administrador</option>
              <option value="papeles">Papeles</option>
              <option value="avaluador">Avaluador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="rounded" />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Usuario activo</label>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const rolePermissions = [
  { perm: 'Ver vehículos', admin: true, papeles: true, avaluador: true, vendedor: true },
  { perm: 'Ver precios', admin: true, papeles: false, avaluador: true, vendedor: false },
  { perm: 'Crear/editar vehículos', admin: true, papeles: false, avaluador: true, vendedor: false },
  { perm: 'Gestionar arreglos', admin: true, papeles: false, avaluador: true, vendedor: false },
  { perm: 'Gestionar ventas', admin: true, papeles: true, avaluador: false, vendedor: true },
  { perm: 'Gestionar usuarios', admin: true, papeles: false, avaluador: false, vendedor: false },
  { perm: 'Recibir notificaciones', admin: true, papeles: false, avaluador: false, vendedor: false },
  { perm: 'Subir documentos', admin: true, papeles: true, avaluador: false, vendedor: false },
];

export default function Users() {
  const { canManageUsers, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((r) => r.data),
    enabled: canManageUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  if (!canManageUsers) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">🔒</div>
        <p>No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  const handleDeactivate = (u: any) => {
    if (u.id === currentUser?.id) return;
    if (confirm(`¿Desactivar al usuario ${u.name}?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    papeles: 'bg-blue-100 text-blue-800',
    avaluador: 'bg-green-100 text-green-800',
    vendedor: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary">
          + Nuevo Usuario
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando usuarios...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${roleColors[u.role] || 'bg-gray-100 text-gray-800'}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditUser(u); setShowModal(true); }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Editar
                      </button>
                      {u.id !== currentUser?.id && u.active && (
                        <button
                          onClick={() => handleDeactivate(u)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Tabla de Permisos por Rol</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Permiso</th>
                <th className="text-center px-4 py-3 font-medium text-purple-700">Admin</th>
                <th className="text-center px-4 py-3 font-medium text-blue-700">Papeles</th>
                <th className="text-center px-4 py-3 font-medium text-green-700">Avaluador</th>
                <th className="text-center px-4 py-3 font-medium text-orange-700">Vendedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rolePermissions.map((p) => (
                <tr key={p.perm} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{p.perm}</td>
                  {['admin', 'papeles', 'avaluador', 'vendedor'].map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      {(p as any)[role] ? (
                        <span className="text-green-600 text-base">✓</span>
                      ) : (
                        <span className="text-gray-300 text-base">✗</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UserModal user={editUser} onClose={() => { setShowModal(false); setEditUser(null); }} />
      )}
    </div>
  );
}
