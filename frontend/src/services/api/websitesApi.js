import httpClient from './httpClient';

export const websitesApi = {
  list: async () => {
    const res = await httpClient.get('/api/websites');
    
    if (Array.isArray(res.data)) {
      return res.data;
    }
    
    if (Array.isArray(res.data?.items)) {
      return res.data.items;
    }
    
    return [];
  },

  create: async (data) => {
    const res = await httpClient.post('/api/websites', data);
    return res.data;
  },

  scan: async (id) => {
    const res = await httpClient.post(`/api/websites/${id}/scan`);
    return res.data;
  },

  get: async (id) => {
    const res = await httpClient.get(`/api/websites/${id}`);
    return res.data;
  },
};