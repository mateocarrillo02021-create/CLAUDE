import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../lib/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'papeles' | 'avaluador' | 'vendedor';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canSeePrice: boolean;
  canEditVehicle: boolean;
  canManageRepairs: boolean;
  canManageSales: boolean;
  canManageUsers: boolean;
  canSeeNotifications: boolean;
  canSeeDocs: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const role = user?.role;

  const canSeePrice = role === 'admin' || role === 'avaluador';
  const canEditVehicle = role === 'admin' || role === 'avaluador';
  const canManageRepairs = role === 'admin' || role === 'avaluador';
  const canManageSales = role === 'admin' || role === 'vendedor' || role === 'papeles';
  const canManageUsers = role === 'admin';
  const canSeeNotifications = role === 'admin';
  const canSeeDocs = role === 'admin' || role === 'papeles';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        canSeePrice,
        canEditVehicle,
        canManageRepairs,
        canManageSales,
        canManageUsers,
        canSeeNotifications,
        canSeeDocs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
