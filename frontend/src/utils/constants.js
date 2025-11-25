export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const API_PREFIX = '/api';
export const AUTH_PREFIX = '/api/auth';
export const USERS_PREFIX = '/api/users';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
};