import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleId: string | null;
  roleName: string | null;
  branchId: string | null;
  branchName: string | null;
  businessId: string;
  businessName: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const token = localStorage.getItem('adminAccessToken');
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (!token && !refreshToken) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (active) {
          setUser(data.data);
          localStorage.setItem('adminUser', JSON.stringify(data.data));
        }
      } catch {
        // The interceptor performs one refresh if possible and clears invalid sessions.
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    
    const { accessToken, refreshToken, user: userData } = data.data;
    
    localStorage.setItem('adminAccessToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // Local logout must still complete if the session is already invalid/offline.
    } finally {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
