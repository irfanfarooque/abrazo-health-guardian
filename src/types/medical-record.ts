export type MedicalRecordType =
  | 'lab_report'
  | 'prescription'
  | 'discharge_summary'
  | 'xray'
  | 'scan'
  | 'other';

export interface MedicalRecord {
  id: string;
  user_id: string;
  record_type: MedicalRecordType;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  extracted_text: string | null;
  doctor_name: string | null;
  hospital_clinic_name: string | null;
  record_date: string | null;
  tags: string[] | null;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

