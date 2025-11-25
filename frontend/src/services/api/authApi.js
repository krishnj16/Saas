import httpClient from './httpClient';
import { AUTH_PREFIX, USERS_PREFIX } from '../../utils/constants';

export const authApi = {
  // POST /api/auth/login
  login: async (credentials) => {
    // Cookies are set automatically by the backend response
    const response = await httpClient.post(`${AUTH_PREFIX}/login`, credentials);
    return response.data; 
  },

  // POST /api/auth/signup
  signup: async (userData) => {
    const response = await httpClient.post(`${AUTH_PREFIX}/signup`, userData);
    return response.data;
  },

  // POST /api/auth/logout
  logout: async () => {
    try {
      await httpClient.post(`${AUTH_PREFIX}/logout`);
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      // We don't need to clear localStorage since we aren't using it for tokens
      window.location.href = '/login';
    }
  },

  // POST /api/auth/refresh
  refresh: async () => {
    const response = await httpClient.post(`${AUTH_PREFIX}/refresh`);
    return response.data;
  },

  // GET /api/users/me
  getMe: async () => {
    const response = await httpClient.get(`${USERS_PREFIX}/me`);
    return response.data;
  }
};