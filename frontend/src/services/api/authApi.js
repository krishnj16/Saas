// src/services/api/authApi.js
import httpClient from './httpClient';

export const authApi = {
  // POST /api/auth/login
  login: async (credentials) => {
    const res = await httpClient.post('/api/auth/login', credentials);
    // backend sets cookies (access_token, refreshToken, csrfToken)
    return res.data;
  },

  // POST /api/auth/signup
  signup: async (userData) => {
    const res = await httpClient.post('/api/auth/signup', userData);
    return res.data;
  },

  // POST /api/auth/logout
  logout: async () => {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (err) {
      // ignore logout errors
    } finally {
      // redirect locally
      window.location.href = '/login';
    }
  },

  // POST /api/auth/refresh
  refresh: async () => {
    const res = await httpClient.post('/api/auth/refresh');
    return res.data;
  },

  // GET /api/users/me (requires cookie)
  getMe: async () => {
    const res = await httpClient.get('/api/users/me');
    return res.data;
  }
};
