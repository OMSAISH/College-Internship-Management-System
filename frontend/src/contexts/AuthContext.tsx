import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLoginAs: (role: 'admin' | 'faculty' | 'student') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cims_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cims_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (localStorage.getItem('cims_token')) {
        const me = await api.getMe();
        setUser(me);
        localStorage.setItem('cims_user', JSON.stringify(me));
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('cims_token');
      localStorage.removeItem('cims_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('cims_token', res.access_token);
      localStorage.setItem('cims_user', JSON.stringify(res.user));
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await api.register(userData);
      // Auto-login after registration
      await login(userData.email, userData.password);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cims_token');
    localStorage.removeItem('cims_user');
  };

  const quickLoginAs = async (role: 'admin' | 'faculty' | 'student') => {
    const credentials = {
      admin: { email: 'admin@demo.local', password: 'Admin@1234' },
      faculty: { email: 'faculty@demo.local', password: 'Faculty@1234' },
      student: { email: 'student@demo.local', password: 'Student@1234' },
    }[role];

    await login(credentials.email, credentials.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => { throw new Error('Auth not ready'); },
      register: async () => { throw new Error('Auth not ready'); },
      logout: () => {},
      refreshUser: async () => {},
      quickLoginAs: async () => {},
    };
  }
  return context;
};
