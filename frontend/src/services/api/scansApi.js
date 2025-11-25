import httpClient from './httpClient';

export const scansApi = {
  discover: async (data) => {
    const response = await httpClient.post('/discover', data);
    return response.data;
  },

  downloadMalware: async () => {
    const response = await httpClient.post('/malware/download-and-queue');
    return response.data;
  }
};