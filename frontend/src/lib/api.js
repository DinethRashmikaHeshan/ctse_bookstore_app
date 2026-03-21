import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

// ── Books ───────────────────────────────────────────────────────────────────
export const booksAPI = {
  getAll:   (params) => api.get('/api/books', { params }),
  getById:  (id)     => api.get(`/api/books/${id}`),
  create:   (data)   => api.post('/api/books', data),
};

// ── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  placeOrder:  (data) => api.post('/api/orders', data),
  getMyOrders: ()     => api.get('/api/orders/my'),
  getById:     (id)   => api.get(`/api/orders/${id}`),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getMy:    ()   => api.get('/api/notifications/my'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
};

// ── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getMe:       () => api.get('/api/users/me'),
  getMyOrders: () => api.get('/api/users/me/orders'),
};

export default api;
