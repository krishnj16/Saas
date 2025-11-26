import httpClient from './httpClient';

export const authApi = {
  login: async (credentials) => {
    const res = await httpClient.post('/api/auth/login', credentials);
    return res.data;
  },

  signup: async (userData) => {
    const res = await httpClient.post('/api/auth/signup', userData);
    return res.data;
  },

  logout: async () => {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (err) {
    } finally {
      window.location.href = '/login';
    }
  },

  refresh: async () => {
    const res = await httpClient.post('/api/auth/refresh');
    return res.data;
  },


  getMe: async () => {
    const res = await httpClient.get('/api/users/me');
    return res.data;
  }
};