import httpClient from './httpClient';

export const findingsApi = {
  list: async (params = {}) => {
    const response = await httpClient.get('/findings', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await httpClient.get(`/findings/${id}`);
    return response.data;
  },

  getVulnerabilities: async () => {
    const response = await httpClient.get('/vulnerabilities');
    return response.data;
  },

  confirmVulnerability: async (id) => {
    const response = await httpClient.post(`/vulnerabilities/${id}/confirm`);
    return response.data;
  }
};