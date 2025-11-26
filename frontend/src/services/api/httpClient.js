// src/services/api/httpClient.js
import axios from 'axios';

// Read cookie value safely
function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
  if (!match) return undefined;
  return decodeURIComponent(match.split('=')[1]);
}

const httpClient = axios.create({
  baseURL: 'http://localhost:4000', // Option A: no /api here
  withCredentials: true,            // send cookies (access_token, refreshToken, csrfToken)
  timeout: 30000,
});

// Attach CSRF token automatically from cookie for state-changing requests
httpClient.interceptors.request.use((config) => {
  try {
    const csrf = getCookie('csrfToken');
    if (csrf) {
      config.headers = config.headers || {};
      // Backend expects X-CSRF-Token
      config.headers['X-CSRF-Token'] = csrf;
    }
  } catch (err) {
    // ignore cookie read errors
  }
  return config;
}, (err) => Promise.reject(err));

export default httpClient;
