import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
// Supabase configuration
const supabaseUrl = 'https://pcgqablgbvwboailbjhm.supabase.co';
const supabaseAnonKey = 'sb_publishable_gtASJL3XplcZxGgKHoG1lw_b7i1Crbh';
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
// Helper function to check if Supabase is properly connected
export const checkSupabaseConnection = async () => {
  try {
    // Try to get the current session as a simple test
    const {
      data,
      error
    } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error);
      return {
        connected: false,
        error
      };
    }
    // Try to select from the profiles table to verify database access
    const {
      error: profilesError
    } = await supabase.from('profiles').select('count').limit(1);
    if (profilesError) {
      console.error('Supabase database access error:', profilesError);
      return {
        connected: false,
        error: profilesError
      };
    }
    return {
      connected: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected Supabase error:', err);
    return {
      connected: false,
      error: err
    };
  }
};