import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { AuthContextType, AuthUser } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(username, password);
      const { token, userId, username: userUsername, email, roles } = response.data;
      
      const userData: AuthUser = {
        id: userId,
        username: userUsername,
        email,
        roles,
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      // Extract errorMessage from ErrorMessageResponse
      const errorMessage = error.response?.data?.errorMessage || 
                          error.response?.data?.message || 
                          'Login failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const register = useCallback(async (userData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      await authAPI.register(userData);
      return { success: true };
    } catch (error: any) {
      // Extract errorMessage from ErrorMessageResponse
      const errorMessage = error.response?.data?.errorMessage || 
                          (typeof error.response?.data === 'string' ? error.response.data : null) ||
                          'Registration failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role as any) || false;
  }, [user]);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    hasRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

