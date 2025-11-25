import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial Session Check
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Try to get current user directly
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        // 2. If getMe fails (401), try to refresh token once
        try {
          await authApi.refresh();
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (refreshError) {
          // If refresh fails, user is strictly logged out
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    // Call login (backend sets HttpOnly cookie)
    await authApi.login({ email, password });
    
    // Fetch user details immediately after login
    const userData = await authApi.getMe();
    setUser(userData);
    return userData;
  };

  const signup = async (payload) => {
    const data = await authApi.signup(payload);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);