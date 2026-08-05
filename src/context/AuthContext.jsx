import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  adminLogin: async () => {},
  adminLogout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('civicpulse_is_admin') === 'true';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch initial auth session to persist login after refresh
    const initAuth = async () => {
      try {
        const { session: currentSession, user: currentUser } = await authService.getCurrentSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentUser || currentSession?.user || null);

          // Check if current user is an admin
          if (currentUser?.email?.includes('admin')) {
            setIsAdmin(true);
            sessionStorage.setItem('civicpulse_is_admin', 'true');
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: authListener } = authService.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession?.user?.email?.includes('admin')) {
          setIsAdmin(true);
          sessionStorage.setItem('civicpulse_is_admin', 'true');
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.signIn({ email, password });
    if (res.session) {
      setSession(res.session);
      setUser(res.user || res.session.user);
      if (email.includes('admin')) {
        setIsAdmin(true);
        sessionStorage.setItem('civicpulse_is_admin', 'true');
      }
    }
    return res;
  };

  const signup = async (email, password, fullName) => {
    const res = await authService.signUp({ email, password, fullName });
    if (res.session) {
      setSession(res.session);
      setUser(res.user || res.session.user);
    }
    return res;
  };

  const logout = async () => {
    const res = await authService.signOut();
    if (!res.error) {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      sessionStorage.removeItem('civicpulse_is_admin');
    }
    return res;
  };

  /**
   * Dedicated Admin Login Authentication
   */
  const adminLogin = async ({ email, password, passcode }) => {
    // 1. Passcode Authentication (Fast Admin Authorization)
    if (passcode && (passcode === 'ADMIN123' || passcode === 'CIVIC_ADMIN_2026')) {
      setIsAdmin(true);
      sessionStorage.setItem('civicpulse_is_admin', 'true');
      return { success: true, error: null };
    }

    // 2. Email & Password Authentication via Supabase
    if (email && password) {
      const res = await authService.signIn({ email, password });
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.session) {
        setSession(res.session);
        setUser(res.user || res.session.user);
        setIsAdmin(true);
        sessionStorage.setItem('civicpulse_is_admin', 'true');
        return { success: true, error: null };
      }
    }

    return { success: false, error: new Error('Invalid Admin Credentials or Passcode.') };
  };

  /**
   * Dedicated Admin Logout
   */
  const adminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('civicpulse_is_admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        login,
        signup,
        logout,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
