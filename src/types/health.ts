export type HealthMetricType =
  | 'blood_pressure'
  | 'heart_rate'
  | 'spo2'
  | 'temperature'
  | 'respiration'
  | 'steps'
  | 'ecg'
  | 'glucose'
  | 'weight'
  | 'other';

export type HealthAlertSeverity = 'red' | 'yellow' | 'green';
export type HealthAlertType = 'critical' | 'warning' | 'info';

export interface HealthMetric {
  id: string;
  user_id: string;
  device_id: string | null;
  metric_type: HealthMetricType;
  systolic: number | null;
  diastolic: number | null;
  value: number | null;
  unit: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

export interface HealthAlert {
  id: string;
  user_id: string;
  alert_type: HealthAlertType;
  severity: HealthAlertSeverity;
  title: string;
  message: string;
  related_metric_ids: string[];
  ai_analysis: string | null;
  recommended_action: string | null;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface LatestHealthMetrics {
  blood_pressure?: { systolic: number; diastolic: number; recorded_at: string };
  heart_rate?: { value: number; unit: string; recorded_at: string };
  spo2?: { value: number; unit: string; recorded_at: string };
  temperature?: { value: number; unit: string; recorded_at: string };
  respiration?: { value: number; unit: string; recorded_at: string };
  steps?: { value: number; unit: string; recorded_at: string };
}

