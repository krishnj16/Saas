import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

// Helper to read the CSRF token from document.cookie
// Backend sets a cookie named 'csrfToken' (or similar). We must send it back in a header.
const getCsrfToken = () => {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrfToken='))
    ?.split('=')[1];
};

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: This allows cookies to be sent/received (HttpOnly tokens)
  withCredentials: true,
});

// Request Interceptor: Attach CSRF Token
httpClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s (Token Expiry)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loops if the refresh endpoint itself fails
      if (originalRequest.url.includes('/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => httpClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the Refresh Endpoint (cookies are sent automatically)
        await httpClient.post(`${API_BASE_URL}/api/auth/refresh`);

        // If successful, retry the original request
        processQueue(null, true);
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Force logout behavior if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;