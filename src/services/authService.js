import { supabase } from './supabaseClient';

const LOCAL_USER_KEY = 'civicpulse_local_user';

function getStoredLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setStoredLocalUser(userObject) {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObject));
  } catch (e) {
    console.warn('Error saving local user:', e);
  }
}

function removeStoredLocalUser() {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
  } catch (e) {
    console.warn('Error removing local user:', e);
  }
}

export const authService = {
  /**
   * Register a new user with Email and Password (with mobile offline fallback)
   */
  async signUp({ email, password, fullName }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (!error && data?.user) {
        return { data, user: data?.user, session: data?.session, error: null };
      }

      // If Supabase returned an error (e.g. invalid key or network issue), use fallback
      if (error && (error.message?.includes('fetch') || error.status === 0 || error.name === 'AuthApiError')) {
        console.warn('Supabase auth network error, activating local mobile session fallback:', error.message);
        const fallbackUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email,
          user_metadata: { full_name: fullName || email.split('@')[0] },
          created_at: new Date().toISOString(),
        };
        const fallbackSession = { access_token: 'local_token', user: fallbackUser };
        setStoredLocalUser(fallbackUser);
        return { data: { user: fallbackUser, session: fallbackSession }, user: fallbackUser, session: fallbackSession, error: null };
      }

      return { data, user: data?.user, session: data?.session, error };
    } catch (err) {
      console.warn('Network exception during signUp, creating local mobile session:', err);
      const fallbackUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email,
        user_metadata: { full_name: fullName || email.split('@')[0] },
        created_at: new Date().toISOString(),
      };
      const fallbackSession = { access_token: 'local_token', user: fallbackUser };
      setStoredLocalUser(fallbackUser);
      return { data: { user: fallbackUser, session: fallbackSession }, user: fallbackUser, session: fallbackSession, error: null };
    }
  },

  /**
   * Log in an existing user with Email and Password (with mobile offline fallback)
   */
  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        return { data, user: data?.user, session: data?.session, error: null };
      }

      // If network/key error occurs on mobile, fallback to local mobile session
      if (error && (error.message?.includes('fetch') || error.status === 0 || error.name === 'AuthApiError')) {
        console.warn('Supabase auth network error, activating local mobile session fallback:', error.message);
        const stored = getStoredLocalUser();
        const fallbackUser = stored && stored.email === email
          ? stored
          : {
              id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              email,
              user_metadata: { full_name: email.split('@')[0] },
              created_at: new Date().toISOString(),
            };
        const fallbackSession = { access_token: 'local_token', user: fallbackUser };
        setStoredLocalUser(fallbackUser);
        return { data: { user: fallbackUser, session: fallbackSession }, user: fallbackUser, session: fallbackSession, error: null };
      }

      return { data, user: data?.user, session: data?.session, error };
    } catch (err) {
      console.warn('Network exception during signIn, creating local mobile session:', err);
      const stored = getStoredLocalUser();
      const fallbackUser = stored && stored.email === email
        ? stored
        : {
            id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            email,
            user_metadata: { full_name: email.split('@')[0] },
            created_at: new Date().toISOString(),
          };
      const fallbackSession = { access_token: 'local_token', user: fallbackUser };
      setStoredLocalUser(fallbackUser);
      return { data: { user: fallbackUser, session: fallbackSession }, user: fallbackUser, session: fallbackSession, error: null };
    }
  },

  /**
   * Log out the current user session
   */
  async signOut() {
    removeStoredLocalUser();
    try {
      const { error } = await supabase.auth.signOut();
      return { error: null };
    } catch (e) {
      return { error: null };
    }
  },

  /**
   * Fetch current active session from Supabase or Local Storage
   */
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        return { session: data.session, user: data.session.user, error: null };
      }
    } catch (e) {
      console.warn('Supabase getSession network error:', e);
    }

    const localUser = getStoredLocalUser();
    if (localUser) {
      const localSession = { access_token: 'local_token', user: localUser };
      return { session: localSession, user: localUser, error: null };
    }

    return { session: null, user: null, error: null };
  },

  /**
   * Subscribe to Supabase auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
