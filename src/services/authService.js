import { supabase } from './supabaseClient';

export const authService = {
  async signUp({ email, password, fullName }) {
    // Placeholder auth method
    return { user: null, session: null, error: null };
  },

  async signIn({ email, password }) {
    // Placeholder sign in method
    return { user: null, session: null, error: null };
  },

  async signOut() {
    // Placeholder sign out method
    return { error: null };
  },

  async getCurrentSession() {
    // Placeholder session getter
    return { session: null, user: null };
  }
};
