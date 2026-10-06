import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export interface LoginResult {
  requires2FA?: boolean;
  requires2FASetup?: boolean;
  tempToken?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  complete2FALogin: (tempToken: string, totpCode?: string, recoveryCode?: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserInState: (updatedUser: User) => void;
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      
      // If 2FA is required, return challenge token without setting session
      if (res.requires_2fa || res.requires_2fa_setup) {
        return {
          requires2FA: res.requires_2fa,
          requires2FASetup: res.requires_2fa_setup,
          tempToken: res.temp_token,
        };
      }

      if (res.access_token && res.user) {
        setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('cims_token', res.access_token);
        localStorage.setItem('cims_user', JSON.stringify(res.user));
        return { requires2FA: false, user: res.user };
      }
      throw new Error('Unexpected response during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const complete2FALogin = async (tempToken: string, totpCode?: string, recoveryCode?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login2fa({
        temp_token: tempToken,
        totp_code: totpCode,
        recovery_code: recoveryCode,
      });

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

  const updateUserInState = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cims_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        complete2FALogin,
        register,
        logout,
        refreshUser,
        updateUserInState,
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
      login: async () => ({ requires2FA: false }),
      complete2FALogin: async () => { throw new Error('Auth not ready'); },
      register: async () => { throw new Error('Auth not ready'); },
      logout: () => {},
      refreshUser: async () => {},
      updateUserInState: () => {},
    };
  }
  return context;
};
