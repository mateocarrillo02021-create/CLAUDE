import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

// Vehicles
export const getVehicles = (search?: string) =>
  api.get('/vehicles', { params: search ? { search } : {} });
export const getVehicle = (id: number) => api.get(`/vehicles/${id}`);
export const createVehicle = (data: any) => api.post('/vehicles', data);
export const updateVehicle = (id: number, data: any) => api.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id: number) => api.delete(`/vehicles/${id}`);

// Repairs
export const getRepairs = () => api.get('/repairs');
export const getRepair = (id: number) => api.get(`/repairs/${id}`);
export const createRepair = (data: any) => api.post('/repairs', data);
export const updateRepair = (id: number, data: any) => api.put(`/repairs/${id}`, data);
export const deleteRepair = (id: number) => api.delete(`/repairs/${id}`);

// Sales
export const getSales = () => api.get('/sales');
export const getSale = (id: number) => api.get(`/sales/${id}`);
export const createSale = (data: any) => api.post('/sales', data);
export const createAbono = (saleId: number, data: any) =>
  api.post(`/sales/${saleId}/abonos`, data);

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: number, data: any) => api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// Maestros
export const getMaestros = () => api.get('/maestros');
export const getAllMaestros = () => api.get('/maestros/all');
export const createMaestro = (data: any) => api.post('/maestros', data);
export const updateMaestro = (id: number, data: any) => api.put(`/maestros/${id}`, data);

// Notifications
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id: number) => api.put(`/notifications/${id}/read`);
export const markAllRead = () => api.put('/notifications/read-all');
