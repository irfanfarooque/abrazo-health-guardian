export type UserProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  language_preference?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
};

export type UserSettingsRecord = {
  id: string;
  user_id: string;
  notification_medicine_reminders: boolean;
  notification_consultation_reminders: boolean;
  notification_health_alerts: boolean;
  notification_ble_status: boolean;
  data_sync_frequency_minutes: number;
  emergency_number?: string | null;
};

