import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { UserProfileRecord } from '@/types/user';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfileRecord | null;
  isLoading: boolean;
  supabaseAvailable: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(supabase));

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
      if (error) {
        // Ignore missing table errors for local dev before migrations run
        if (error.code !== '42P01') {
          console.warn('[Auth] Failed to fetch profile', error.message);
        }
        setProfile({
          id: userId,
          email: session?.user.email ?? '',
          full_name: session?.user.user_metadata?.full_name ?? null,
        });
        return;
      }
      setProfile(data as UserProfile);
    },
    [session?.user, supabase],
  );

  useEffect(() => {
    if (!supabase) return;
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setIsLoading(false);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });
    subscription = data.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const upsertProfile = useCallback(
    async (userId: string, fullName: string, email: string) => {
      if (!supabase) return;
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, full_name: fullName, email }, { onConflict: 'id' });

      if (error && error.code !== '42P01') {
        console.warn('[Auth] Failed to upsert profile', error.message);
      }
    },
    [supabase],
  );

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) {
        Alert.alert('Supabase not configured', 'Please add your Supabase keys to the .env file.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }
    },
    [supabase],
  );

  const signUp = useCallback(
    async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      if (!supabase) {
        Alert.alert('Supabase not configured', 'Please add your Supabase keys to the .env file.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.user) {
        await upsertProfile(data.user.id, fullName, email);
      }
    },
    [supabase, upsertProfile],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        Alert.alert('Supabase not configured', 'Please add your Supabase keys to the .env file.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://app.abrazo.health/reset-password',
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading: isLoading && Boolean(supabase),
      supabaseAvailable: Boolean(supabase),
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [session, profile, isLoading, supabase, signIn, signUp, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

