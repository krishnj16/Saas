import axios from 'axios';

function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return undefined;
}

const httpClient = axios.create({
  baseURL: 'http://localhost:4000',  
  withCredentials: true,             
  timeout: 30000,
});

httpClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();

    // attach CSRF only for unsafe methods
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrf = getCookie('csrf_token');

      if (csrf) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrf; // MUST match backend
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export default httpClient;  
