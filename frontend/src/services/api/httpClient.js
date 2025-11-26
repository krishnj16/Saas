import axios from 'axios';

function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
  if (!match) return undefined;
  return decodeURIComponent(match.split('=')[1]);
}

const httpClient = axios.create({
  baseURL: 'http://localhost:4000',  
  withCredentials: true,             
  timeout: 30000,
});

httpClient.interceptors.request.use((config) => {
  try {
    const csrf = getCookie('csrfToken');
    if (csrf) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrf;
    }
  } catch (err) {
    console.error('CSRF read failed', err);
  }
  return config;
}, (err) => Promise.reject(err));

export default httpClient;  
