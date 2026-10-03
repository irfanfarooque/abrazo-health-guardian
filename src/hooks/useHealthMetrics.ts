import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { HealthMetric, LatestHealthMetrics, HealthMetricType } from '@/types/health';

export function useHealthMetrics() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [latest, setLatest] = useState<LatestHealthMetrics>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchLatestMetrics = useCallback(async () => {
    if (!supabase || !user) {
      setLatest({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const metricTypes: HealthMetricType[] = ['blood_pressure', 'heart_rate', 'spo2', 'temperature', 'respiration', 'steps'];
      const latestMap: LatestHealthMetrics = {};

      for (const type of metricTypes) {
        const { data, error: queryError } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .eq('metric_type', type)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryError && queryError.code !== '42P01') {
          console.warn(`[Health] Failed to fetch latest ${type}:`, queryError.message);
          continue;
        }

        if (data) {
          if (type === 'blood_pressure' && data.systolic && data.diastolic) {
            latestMap.blood_pressure = {
              systolic: data.systolic,
              diastolic: data.diastolic,
              recorded_at: data.recorded_at,
            };
          } else if (data.value !== null) {
            latestMap[type as keyof LatestHealthMetrics] = {
              value: data.value,
              unit: data.unit || '',
              recorded_at: data.recorded_at,
            } as any;
          }
        }
      }

      setLatest(latestMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health metrics');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  const fetchRecentMetrics = useCallback(
    async (limit = 50) => {
      if (!supabase || !user) {
        setMetrics([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(limit);

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setMetrics(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health metrics');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user],
  );

  const addMetric = useCallback(
    async (metric: Omit<HealthMetric, 'id' | 'user_id' | 'created_at'>) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('health_metrics')
        .insert({
          ...metric,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      await fetchLatestMetrics();
      return data;
    },
    [supabase, user, fetchLatestMetrics],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchLatestMetrics();
    }
  }, [canUseSupabase, fetchLatestMetrics]);

  return {
    latest,
    metrics,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchLatestMetrics,
    fetchRecent: fetchRecentMetrics,
    addMetric,
  };
}

