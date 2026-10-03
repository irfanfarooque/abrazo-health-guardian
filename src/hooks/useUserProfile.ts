import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { UserProfileRecord } from '@/types/user';

type ProfileFormValues = Pick<
  UserProfileRecord,
  'full_name' | 'phone' | 'language_preference' | 'emergency_contact_name' | 'emergency_contact_phone' | 'emergency_contact_relation'
>;

const emptyProfile: ProfileFormValues = {
  full_name: '',
  phone: '',
  language_preference: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
};

export function useUserProfile() {
  const { user, supabaseAvailable } = useAuth();
  const supabase = getSupabase();
  const canUseSupabase = Boolean(user && supabase && supabaseAvailable);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(canUseSupabase));
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!canUseSupabase || !user || !supabase) return;
    setIsLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (queryError) {
      if (queryError.code !== 'PGRST116' && queryError.code !== '42P01') {
        setError(queryError.message);
        console.warn('[useUserProfile] query error', queryError);
      }
      setProfile({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? '',
      });
    } else {
      setProfile(data as UserProfileRecord);
    }
    setIsLoading(false);
  }, [canUseSupabase, supabase, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(
    async (values: ProfileFormValues) => {
      if (!canUseSupabase || !user || !supabase) {
        Alert.alert('Supabase not configured', 'Add your Supabase keys to enable profile saving.');
        return;
      }
      setError(null);
      const payload = {
        id: user.id,
        email: user.email,
        ...values,
      };
      const { error: upsertError } = await supabase.from('user_profiles').upsert(payload, { onConflict: 'id' }).select().single();
      if (upsertError) {
        setError(upsertError.message);
        throw upsertError;
      }
      setProfile((prev) => ({
        ...(prev || { id: user.id, email: user.email ?? null }),
        ...payload,
      }));
    },
    [canUseSupabase, supabase, user],
  );

  const profileFormValues: ProfileFormValues = useMemo(() => {
    if (!profile) return emptyProfile;
    return {
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      language_preference: profile.language_preference ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_phone: profile.emergency_contact_phone ?? '',
      emergency_contact_relation: profile.emergency_contact_relation ?? '',
    };
  }, [profile]);

  return {
    profile,
    profileFormValues,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    saveProfile,
    refresh: loadProfile,
  };
}

