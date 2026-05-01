import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  return {
    token,
    email:    localStorage.getItem('email')    || '',
    fullName: localStorage.getItem('fullName') || ''
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession);

  useEffect(() => {
    const sync = () => setUser(readStoredSession());
    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth-changed', sync);
    };
  }, []);

  const signIn = useCallback((authResponse) => {
    localStorage.setItem('token',    authResponse.token);
    localStorage.setItem('email',    authResponse.email    ?? '');
    localStorage.setItem('fullName', authResponse.fullName ?? '');
    setUser({
      token: authResponse.token,
      email: authResponse.email ?? '',
      fullName: authResponse.fullName ?? ''
    });
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    setUser(null);
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthed: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};