import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchMe, loadUser, clearSession, hasSessionToken } from '../lib/auth';
import type { User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  loaded: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loaded: false,
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser());
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    if (!hasSessionToken()) {
      setUser(null);
      setLoaded(true);
      return;
    }
    try {
      setUser(await fetchMe());
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loaded, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}