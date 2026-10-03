export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: ChatMessageRole;
  content: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIAction {
  type: 'book_consultation' | 'order_medicine' | 'analyze_health' | 'first_aid' | 'general';
  data?: Record<string, any>;
}

export interface HealthContext {
  latest_metrics?: {
    blood_pressure?: { systolic: number; diastolic: number; recorded_at: string };
    heart_rate?: { value: number; unit: string; recorded_at: string };
    spo2?: { value: number; unit: string; recorded_at: string };
    temperature?: { value: number; unit: string; recorded_at: string };
  };
  active_alerts?: Array<{
    severity: string;
    title: string;
    message: string;
  }>;
  current_medicines?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  upcoming_consultations?: Array<{
    date: string;
    doctor_name: string;
  }>;
}

