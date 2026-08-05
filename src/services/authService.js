import { supabase } from './supabaseClient';

export const authService = {
  /**
   * Register a new user with Email and Password
   */
  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { data, user: data?.user, session: data?.session, error };
  },

  /**
   * Log in an existing user with Email and Password
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, user: data?.user, session: data?.session, error };
  },

  /**
   * Log out the current user session
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Fetch current active session from Supabase
   */
  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, user: data?.session?.user || null, error };
  },

  /**
   * Subscribe to Supabase auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
