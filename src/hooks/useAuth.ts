import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

export function useAuth() {
  const supabase = getSupabase();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseAvailable = Boolean(supabase);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (!supabase) {
          console.warn('[useAuth] Supabase not configured');
          if (mounted) setIsLoading(false);
          return;
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[useAuth] session error:', sessionError);
          if (mounted) {
            setError(sessionError.message);
            setUser(null);
          }
        } else if (session?.user) {
          console.log('[useAuth] User found:', session.user.id);
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email,
            });
          }
        } else {
          console.log('[useAuth] No session found');
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('[useAuth] initialization error:', err);
        if (mounted) {
          setError((err as Error)?.message ?? 'Auth init failed');
          setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.id);
        if (mounted) {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
            });
          } else {
            setUser(null);
          }
        }
      });

      return () => {
        mounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const logout = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('[useAuth] logout error:', err);
      setError((err as Error)?.message ?? 'Logout failed');
    }
  }, [supabase]);

  return {
    user,
    isLoading,
    error,
    supabaseAvailable,
    logout,
  };
}

