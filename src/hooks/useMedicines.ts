import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { UserMedicine, MedicineFrequency } from '@/types/medicine';

export function useMedicines() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchMedicines = useCallback(async () => {
    if (!supabase || !user) {
      setMedicines([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('user_medicines')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setMedicines(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medicines');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  const addMedicine = useCallback(
    async (medicine: {
      medicine_name: string;
      dosage: string;
      frequency: MedicineFrequency;
      start_date: string;
      end_date?: string | null;
      quantity_total?: number | null;
      notes?: string | null;
      custom_schedule?: Record<string, any> | null;
    }) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('user_medicines')
        .insert({
          ...medicine,
          user_id: user.id,
          quantity_remaining: medicine.quantity_total || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchMedicines();
        return data;
      }

      return null;
    },
    [supabase, user, fetchMedicines],
  );

  const updateMedicine = useCallback(
    async (medicineId: string, updates: Partial<UserMedicine>) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('user_medicines')
        .update(updates)
        .eq('id', medicineId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchMedicines();
    },
    [supabase, user, fetchMedicines],
  );

  const removeMedicine = useCallback(
    async (medicineId: string) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('user_medicines')
        .update({ is_active: false })
        .eq('id', medicineId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchMedicines();
    },
    [supabase, user, fetchMedicines],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchMedicines();
    }
  }, [canUseSupabase, fetchMedicines]);

  return {
    medicines,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchMedicines,
    addMedicine,
    updateMedicine,
    removeMedicine,
  };
}

