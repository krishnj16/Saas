import httpClient from './httpClient';

const normalizeList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items; 
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.notifications)) return payload.notifications;
  return [];
};

export const notificationsApi = {
  list: async () => {
    const res = await httpClient.get('/api/notifications');
    return normalizeList(res.data);
  },

  markRead: async (ids) => {
    const res = await httpClient.post('/api/notifications/mark-read', ids || {});
    return res.data;
  }
};
