import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { MedicineReminder, MedicineIntakeLog } from '@/types/medicine';

export function useMedicineReminders(medicineId?: string) {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<MedicineIntakeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchReminders = useCallback(async () => {
    if (!supabase || !user || !medicineId) {
      setReminders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('medicine_reminders')
        .select('*')
        .eq('user_medicine_id', medicineId)
        .eq('is_active', true)
        .order('reminder_time', { ascending: true });

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setReminders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, medicineId]);

  const fetchIntakeLogs = useCallback(
    async (limit = 30) => {
      if (!supabase || !user || !medicineId) {
        setIntakeLogs([]);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('medicine_intake_log')
          .select('*')
          .eq('user_medicine_id', medicineId)
          .order('scheduled_time', { ascending: false })
          .limit(limit);

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setIntakeLogs(data || []);
      } catch (err) {
        console.error('[Reminders] Failed to fetch intake logs:', err);
      }
    },
    [supabase, user, medicineId],
  );

  const addReminder = useCallback(
    async (reminder: {
      user_medicine_id: string;
      reminder_time: string; // HH:MM format
      days_of_week?: number[] | null;
    }) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('medicine_reminders')
        .insert({
          ...reminder,
          is_active: true,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchReminders();
        return data;
      }

      return null;
    },
    [supabase, user, fetchReminders],
  );

  const updateReminder = useCallback(
    async (reminderId: string, updates: Partial<MedicineReminder>) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('medicine_reminders')
        .update(updates)
        .eq('id', reminderId);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchReminders();
    },
    [supabase, user, fetchReminders],
  );

  const removeReminder = useCallback(
    async (reminderId: string) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('medicine_reminders')
        .update({ is_active: false })
        .eq('id', reminderId);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchReminders();
    },
    [supabase, user, fetchReminders],
  );

  const logIntake = useCallback(
    async (log: {
      user_medicine_id: string;
      scheduled_time: string;
      taken_at?: string;
      is_taken?: boolean;
      is_missed?: boolean;
      notes?: string | null;
      reminder_id?: string | null;
    }) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('medicine_intake_log')
        .insert({
          ...log,
          is_taken: log.is_taken ?? true,
          is_missed: log.is_missed ?? false,
          taken_at: log.taken_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchIntakeLogs();
        return data;
      }

      return null;
    },
    [supabase, user, fetchIntakeLogs],
  );

  useEffect(() => {
    if (canUseSupabase && medicineId) {
      fetchReminders();
      fetchIntakeLogs();
    }
  }, [canUseSupabase, medicineId, fetchReminders, fetchIntakeLogs]);

  return {
    reminders,
    intakeLogs,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchReminders,
    addReminder,
    updateReminder,
    removeReminder,
    logIntake,
    fetchIntakeLogs,
  };
}

