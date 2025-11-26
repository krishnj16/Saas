import httpClient from './httpClient';

export const adminApi = {
  getStats: async () => {
    const response = await httpClient.get('/api/users/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await httpClient.get('/api/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await httpClient.post('/api/users', userData);
    return response.data;
  },

  muteNotification: async (data) => {
    const response = await httpClient.post('/api/adminNotifications/mute', data);
    return response.data;
  },

  getMutes: async () => {
    const response = await httpClient.get('/api/adminNotifications/mutes');
    return response.data;
  }
};