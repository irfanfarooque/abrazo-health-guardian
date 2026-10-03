export type MedicineFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'thrice_daily'
  | 'four_times_daily'
  | 'as_needed'
  | 'custom';

export interface MedicineCatalog {
  id: string;
  name: string;
  generic_name: string | null;
  manufacturer: string | null;
  dosage_form: string | null;
  strength: string | null;
  description: string | null;
  image_url: string | null;
  is_prescription_required: boolean;
  created_at: string;
}

export interface UserMedicine {
  id: string;
  user_id: string;
  medicine_catalog_id: string | null;
  medicine_name: string;
  dosage: string;
  frequency: MedicineFrequency;
  custom_schedule: Record<string, any> | null;
  start_date: string;
  end_date: string | null;
  quantity_total: number | null;
  quantity_remaining: number | null;
  notes: string | null;
  prescribed_by_doctor_id: string | null;
  consultation_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicineReminder {
  id: string;
  user_medicine_id: string;
  reminder_time: string; // TIME format
  days_of_week: number[] | null; // [0=Sunday, 1=Monday, ..., 6=Saturday] or null for daily
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineIntakeLog {
  id: string;
  user_medicine_id: string;
  reminder_id: string | null;
  scheduled_time: string;
  taken_at: string | null;
  is_taken: boolean;
  is_missed: boolean;
  notes: string | null;
  created_at: string;
}

export interface MedicineOrder {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  pharmacy_name: string | null;
  pharmacy_contact: string | null;
  ordered_at: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineOrderItem {
  id: string;
  order_id: string;
  medicine_catalog_id: string | null;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

