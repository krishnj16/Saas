import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        try {
          await authApi.refresh();
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (refreshError) {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    await authApi.login({ email, password });
    
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