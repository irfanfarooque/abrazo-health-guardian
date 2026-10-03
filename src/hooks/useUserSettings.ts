import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { UserSettingsRecord } from '@/types/user';

const defaultSettings: Omit<UserSettingsRecord, 'id' | 'user_id'> = {
  notification_medicine_reminders: true,
  notification_consultation_reminders: true,
  notification_health_alerts: true,
  notification_ble_status: true,
  data_sync_frequency_minutes: 5,
  emergency_number: '911',
};

export type SettingsPatch = Partial<Omit<UserSettingsRecord, 'id' | 'user_id'>>;

export function useUserSettings() {
  const { user, supabaseAvailable } = useAuth();
  const supabase = getSupabase();
  const canUseSupabase = Boolean(user && supabase && supabaseAvailable);
  const [settings, setSettings] = useState<UserSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(canUseSupabase));
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!canUseSupabase || !user || !supabase) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError) {
        // Known non-fatal DB errors (missing table, no rows) fall back to defaults
        if (queryError.code && queryError.code !== 'PGRST116' && queryError.code !== '42P01') {
          setError(queryError.message);
          console.warn('[useUserSettings] query error', queryError);
        }
        setSettings({
          id: '',
          user_id: user.id,
          ...defaultSettings,
        });
      } else if (!data) {
        // No record found -> defaults
        setSettings({
          id: '',
          user_id: user.id,
          ...defaultSettings,
        });
      } else {
        setSettings(data as UserSettingsRecord);
      }
    } catch (err) {
      console.error('[useUserSettings] unexpected error', err);
      setError((err as Error)?.message ?? 'Failed to load settings');
      setSettings({
        id: '',
        user_id: user.id,
        ...defaultSettings,
      });
    } finally {
      setIsLoading(false);
    }
  }, [canUseSupabase, supabase, user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (patch: SettingsPatch) => {
      if (!canUseSupabase || !user || !supabase) {
        Alert.alert('Supabase not configured', 'Add your Supabase keys to enable settings.');
        return;
      }
      setError(null);
      const payload = {
        user_id: user.id,
        ...defaultSettings,
        ...(settings ?? {}),
        ...patch,
      };
      try {
        const { data, error: upsertError } = await supabase
          .from('user_settings')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if (upsertError) {
          setError(upsertError.message);
          throw upsertError;
        }
        setSettings(data as UserSettingsRecord);
      } catch (err) {
        console.error('[useUserSettings] upsert error', err);
        setError((err as Error)?.message ?? 'Failed to update settings');
        throw err;
      }
    },
    [canUseSupabase, supabase, user, settings],
  );

  const mergedSettings = useMemo(() => {
    if (!settings) {
      return {
        id: '',
        user_id: user?.id ?? '',
        ...defaultSettings,
      };
    }
    return settings;
  }, [settings, user?.id]);

  return {
    settings: mergedSettings,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    updateSettings,
    refresh: loadSettings,
  };
}

