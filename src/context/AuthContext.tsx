import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{
    error: any;
  }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{
    error: any;
    data?: any;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  supabaseStatus: 'checking' | 'connected' | 'error';
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      const {
        connected,
        error
      } = await checkSupabaseConnection();
      if (connected) {
        setSupabaseStatus('connected');
      } else {
        console.error('Supabase connection error:', error);
        setSupabaseStatus('error');
      }
    };
    checkConnection();
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        // Check active session
        const {
          data: {
            session
          },
          error
        } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          throw error;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
      } catch (err: any) {
        console.error('Error getting session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();
    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
    });
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      // Check Supabase connection first
      if (supabaseStatus === 'error') {
        return {
          error: new Error('Unable to connect to the database. Please try again later.')
        };
      }
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        console.error('Sign in error:', error);
      }
      return {
        error
      };
    } catch (err: any) {
      console.error('Sign in exception:', err);
      setError(err.message);
      return {
        error: err
      };
    }
  };
  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      // Check Supabase connection first
      if (supabaseStatus === 'error') {
        return {
          error: new Error('Unable to connect to the database. Please try again later.'),
          data: null
        };
      }
      console.log('Starting signup process for:', email);
      // First attempt the signup
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata?.name || email.split('@')[0]
          },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('Sign up error:', error);
        return {
          error,
          data: null
        };
      }
      console.log('Auth signup successful:', data);
      // If signup successful but email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        console.log('User created, waiting for email confirmation');
        return {
          data,
          error: null
        };
      }
      // If signup successful and no email confirmation required (or already confirmed)
      if (data?.user && data.session) {
        console.log('Creating profile for user:', data.user.id);
        try {
          // We have a session, so we're authenticated for this request
          const {
            error: profileError
          } = await supabase.from('profiles').insert({
            id: data.user.id,
            name: metadata?.name || email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).single();
          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Check if profile already exists - this is not an error
            if (profileError.code === '23505') {
              console.log('Profile already exists - continuing normally');
            } else {
              // For other errors, log detailed information but don't fail the signup
              console.error('Profile creation error details:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
              });
            }
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileErr: any) {
          // Log the error but don't fail the signup process
          console.error('Exception creating profile:', profileErr);
        }
      }
      return {
        data,
        error: null
      };
    } catch (err: any) {
      console.error('Sign up exception:', err);
      setError(err.message);
      return {
        error: err,
        data: null
      };
    }
  };
  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message);
    }
  };
  return <AuthContext.Provider value={{
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
    error,
    isAuthenticated,
    supabaseStatus
  }}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}