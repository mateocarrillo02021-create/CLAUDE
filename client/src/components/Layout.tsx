import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../lib/api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, canSeeNotifications, canManageUsers, canManageRepairs, canManageSales, canSeeDocs } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => getUnreadCount().then((r) => r.data),
    enabled: canSeeNotifications,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <span className="font-bold text-gray-900 text-lg">GestiCar</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={navClass}>
                Panel
              </NavLink>
              <NavLink to="/vehicles" className={navClass}>
                Vehículos
              </NavLink>
              {canManageRepairs && (
                <NavLink to="/repairs" className={navClass}>
                  Arreglos
                </NavLink>
              )}
              {canManageSales && (
                <NavLink to="/sales" className={navClass}>
                  Ventas
                </NavLink>
              )}
              {canManageUsers && (
                <NavLink to="/users" className={navClass}>
                  Usuarios
                </NavLink>
              )}
              {canSeeNotifications && (
                <NavLink to="/notifications" className={navClass}>
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Salir
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2 px-4">
            <nav className="flex flex-col gap-1">
              <NavLink to="/dashboard" className={navClass} onClick={() => setMenuOpen(false)}>Panel</NavLink>
              <NavLink to="/vehicles" className={navClass} onClick={() => setMenuOpen(false)}>Vehículos</NavLink>
              {canManageRepairs && (
                <NavLink to="/repairs" className={navClass} onClick={() => setMenuOpen(false)}>Arreglos</NavLink>
              )}
              {canManageSales && (
                <NavLink to="/sales" className={navClass} onClick={() => setMenuOpen(false)}>Ventas</NavLink>
              )}
              {canManageUsers && (
                <NavLink to="/users" className={navClass} onClick={() => setMenuOpen(false)}>Usuarios</NavLink>
              )}
              {canSeeNotifications && (
                <NavLink to="/notifications" className={navClass} onClick={() => setMenuOpen(false)}>
                  Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
