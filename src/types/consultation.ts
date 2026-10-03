export type ConsultationType = 'in_person' | 'online' | 'phone';
export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialty_id: string;
  qualification: string | null;
  experience_years: number | null;
  hospital_clinic_name: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  profile_image_url: string | null;
  consultation_fee: number | null;
  is_available: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  doctor_id: string;
  specialty_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  consultation_type: ConsultationType;
  location: string | null;
  meeting_link: string | null;
  status: ConsultationStatus;
  reason: string | null;
  notes: string | null;
  prescription_id: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

