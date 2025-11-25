import httpClient from './httpClient';

export const adminApi = {
  getStats: async () => {
    const response = await httpClient.get('/user/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await httpClient.get('/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await httpClient.post('/users', userData);
    return response.data;
  },

  muteNotification: async (data) => {
    const response = await httpClient.post('/adminNotifications/mute', data);
    return response.data;
  },

  getMutes: async () => {
    const response = await httpClient.get('/adminNotifications/mutes');
    return response.data;
  }
};