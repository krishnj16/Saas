import httpClient from './httpClient';

export const websitesApi = {
  list: async () => {
    const response = await httpClient.get('/websites');
    return response.data;
  },

  get: async (id) => {
    const response = await httpClient.get(`/websites/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await httpClient.post('/websites', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await httpClient.patch(`/websites/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await httpClient.delete(`/websites/${id}`);
    return response.data;
  },

  scan: async (id) => {
    const response = await httpClient.post(`/websites/${id}/scan`);
    return response.data;
  }
};