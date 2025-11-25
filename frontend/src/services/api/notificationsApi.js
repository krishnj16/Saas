import httpClient from './httpClient';

export const notificationsApi = {
  list: async () => {
    const response = await httpClient.get('/notifications');
    return response.data;
  },

  markRead: async () => {
    const response = await httpClient.post('/notifications/mark-read');
    return response.data;
  }
};