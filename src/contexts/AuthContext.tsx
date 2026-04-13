import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { User } from '@/types';
import {
  loginUser,
  registerUser,
  getSafeUserById,
  updateUserProfile,
} from '@/lib/mock-db';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    inviteCode?: string | null
  ) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('taskflow_token');
    const savedUser = localStorage.getItem('taskflow_user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(atob(savedToken));
        if (parsed.exp > Date.now()) {
          setToken(savedToken);
          let u = JSON.parse(savedUser) as User;
          if (!u.org_id && parsed.user_id) {
            const fresh = getSafeUserById(parsed.user_id as string);
            if (fresh) {
              u = fresh;
              localStorage.setItem('taskflow_user', JSON.stringify(u));
            }
          }
          setUser(u);
        } else {
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('taskflow_user');
        }
      } catch {
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('taskflow_token', res.token);
    localStorage.setItem('taskflow_user', JSON.stringify(res.user));
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      inviteCode?: string | null
    ) => {
      const res = await registerUser(name, email, password, inviteCode);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('taskflow_token', res.token);
      localStorage.setItem('taskflow_user', JSON.stringify(res.user));
    },
    []
  );

  const updateProfile = useCallback(
    async (name: string) => {
      if (!user) return;
      const updated = await updateUserProfile(user.id, { name });
      setUser(updated);
      localStorage.setItem('taskflow_user', JSON.stringify(updated));
    },
    [user]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
