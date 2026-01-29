import httpClient from './httpClient';

export const scansApi = {
  discover: async (data) => {
    const res = await httpClient.post('/api/discovery/discover', data);
    return res.data;
  },

  downloadMalware: async (data) => {
    const res = await httpClient.post('/api/malware/download-and-queue', data || {});
    return res.data;
  }
};