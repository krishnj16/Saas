// src/services/api/findingsApi.js
import httpClient from './httpClient';

export const findingsApi = {
  list: async (params = {}) => {
    const res = await httpClient.get('/api/findings', { params });
    // backend returns { data: [...] }
    if (Array.isArray(res.data?.data)) return res.data.data;
    // fallback: return entire response if it's already an array
    if (Array.isArray(res.data)) return res.data;
    return res.data || [];
  },

  get: async (id) => {
    const res = await httpClient.get(`/api/findings/${id}`);
    return res.data;
  }
};
