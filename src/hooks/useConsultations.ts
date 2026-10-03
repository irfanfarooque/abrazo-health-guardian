import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Consultation, Doctor, Specialty, ConsultationType, ConsultationStatus } from '@/types/consultation';

export function useConsultations() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchConsultations = useCallback(
    async (status?: ConsultationStatus) => {
      if (!supabase || !user) {
        setConsultations([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('consultations')
          .select('*')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error: queryError } = await query;

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setConsultations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch consultations');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user],
  );

  const bookConsultation = useCallback(
    async (consultation: {
      doctor_id: string;
      specialty_id: string;
      appointment_date: string;
      appointment_time: string;
      consultation_type: ConsultationType;
      location?: string | null;
      meeting_link?: string | null;
      reason?: string | null;
      duration_minutes?: number;
    }) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('consultations')
        .insert({
          ...consultation,
          user_id: user.id,
          status: 'scheduled',
          duration_minutes: consultation.duration_minutes || 30,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchConsultations();
        return data;
      }

      return null;
    },
    [supabase, user, fetchConsultations],
  );

  const cancelConsultation = useCallback(
    async (consultationId: string) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', consultationId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchConsultations();
    },
    [supabase, user, fetchConsultations],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchConsultations();
    }
  }, [canUseSupabase, fetchConsultations]);

  return {
    consultations,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchConsultations,
    bookConsultation,
    cancelConsultation,
  };
}

export function useDoctors(specialtyId?: string) {
  const supabase = getSupabase();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    if (!supabase) {
      setDoctors([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('doctors').select('*').eq('is_available', true);

      if (specialtyId) {
        query = query.eq('specialty_id', specialtyId);
      }

      const { data, error: queryError } = await query.order('rating', { ascending: false });

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setDoctors(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctors');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, specialtyId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return {
    doctors,
    isLoading,
    error,
    refresh: fetchDoctors,
  };
}

export function useSpecialties() {
  const supabase = getSupabase();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    if (!supabase) {
      setSpecialties([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase.from('specialties').select('*').order('name', { ascending: true });

      if (queryError && queryError.code !== '42P01') {
        throw new Error(queryError.message);
      }

      setSpecialties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch specialties');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  return {
    specialties,
    isLoading,
    error,
    refresh: fetchSpecialties,
  };
}

