import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getAuthUser } from '../../api/auth';
import type { AuthUser } from '../../api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  // 회원가입 같은 케이스에서 즉시 인증 상태로 전환할 때
  setAuthenticated: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const fetched = await getAuthUser();
    setUser(fetched);
    setStatus(fetched ? 'authenticated' : 'unauthenticated');
  }, []);

  const setAuthenticated = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    setStatus(nextUser ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ status, user, refresh, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다.');
  return ctx;
}
