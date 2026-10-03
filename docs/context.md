# 📱 APP NAME (placeholder): "ABRAZO Health Guardian"

##Tech Stack:
Frontend: React Native with TypeScript, Expo, and Expo Router
Backend/Database: Supabase
UI Framework: React Native Paper
AI Processing: DeepSeek


## 1. Overview

Build a health-monitoring mobile application powered by AI, capable of:

- Reading biometric data from Bluetooth/BLE health devices (smartwatches, health bands, medical BLE sensors).
- Real-time monitoring of BP, SpO₂, heart rate, and any other supported metrics.
- Providing AI-driven trend analysis, warnings, and health alerts.
- Offering consultation booking, medical records management, medicine tracking & reminders, and emergency services.
- Providing an AI chat assistant for first aid guidance, booking consultations, ordering medications, and general health support.

## 2. Core Screens & Flow

### 2.1 Login / Sign-Up Screen

- Standard login (email/phone + password)
- Sign-up for new users
- Password reset
- Secure authentication (JWT or OAuth)
- After login → redirect to Main Dashboard

## 3. Main Dashboard

### Header

- A greeting text: "Welcome, {UserName}"
- Top-right: Profile icon (opens profile settings)
- Top-left: Hamburger menu (opens side navigation panel)

### Main Feature Cards

#### A. "Check Health Status"

Displays:

- Blood Pressure
- SpO₂
- Heart Rate
- Temperature (if available)
- Respiration (if available)
- Steps, ECG, or any data provided by connected BLE devices

- Pulls data in real-time or periodically via BLE
- Shows last updated timestamp

#### B. "Health Alerts / AI Warnings"

- AI analyses user's historical data
- Detects:
  - Irregular trends
  - Sudden spikes/drops
  - Dangerous patterns
- Generates:
  - Red alert (critical)
  - Yellow alert (concerning)
  - Green (normal)
- Shows explanation + recommended action

#### C. Emergency Button

- Large, clearly visible red button
- If pressed:
  - Calls ambulance (configurable emergency number)
  - Sends SMS/Call to caregiver(s)
  - Includes location + health status snapshot
  - Caregiver details can be added/edited in settings

### Floating AI Action Button

- A floating popup button on the main page
- On tap → Opens AI Health Chat Assistant
- Capabilities:
  - First-aid guidance
  - Can book/cancel consultations
  - Can order medicines
  - Can analyse health readings
  - Can answer health-related questions

## 4. Hamburger Menu Options

### A. Consultation

Sub-options:

- **Upcoming Consultations**
  - List of all booked consultations
  - Dates, doctor name, location/online link
- **Book / Cancel Consultation**
  - Choose specialty
  - Choose doctor
  - Time/date slot selection
  - Cancel option

### B. Medical Records

Sub-options:

- **View Medical Records**
  - Lab reports
  - Prescriptions
  - Discharge summaries
  - Uploadable PDFs/images
- **Add Medical Record**
  - Upload file, add notes
  - Auto-extract text using AI (OCR optional)

### C. Medicines

Sub-options:

- **Current Medicines**
  - List of all medicines the user is taking
  - Dosage, frequency, start date, expiry/run-out date
- **Order / Buy Medicines**
  - Integration placeholder for pharmacy API
- **Set Reminders**
  - Timed notifications
  - Dosage alerts
  - Schedule editor

## 5. Notifications System

The app should generate local + push notifications for:

- Medicine reminders
- Consultation reminders (on the consulting day or 24 hrs before)
- Health alerts (AI-detected anomalies)
- BLE device battery low / disconnected

## 6. BLE Integration Requirements

- Connect to Bluetooth Smart / BLE devices
- Auto-detect supported sensors:
  - BP monitor
  - Heart rate monitor
  - SpO₂ sensors
  - Smartwatch metrics
- Continuous or periodic polling
- Background data sync allowed
- Data standardization across different brands/models

## 7. AI Assistant Requirements

The AI should be able to:

- Provide first aid guidance
- Analyse health data trends
- Explain medical readings in simple terms
- Book consultations (integration with app logic)
- Order medicines (integration with app logic)
- Provide reminders or summaries

The tone should be supportive, medical-safe, and non-alarming unless danger is real.

## 8. Optional Enhancements (You may include these)

- Dark mode
- Multi-language support
- Offline mode for viewing records
- Basic health tips section
- Chat history with AI
- Graphs of health metrics over time
- Emergency geolocation sharing

## 9. Development Requirements

- Should run on Android + iOS
- Preferably Flutter / React Native
- Clean modular architecture
- Secure health data storage
- GDPR/HIPAA-like privacy measures

## 10. Final Output Expectation

Based on this prompt, produce:

- Full UI/UX design
- Database schema
- API endpoints
- BLE integration flow
- AI assistant logic
- Notification system
- Code structure or actual code (if asked)
- Anything needed to make the app completely functional

## 11. Database Schema (Supabase/PostgreSQL)

### 11.1 Users & Authentication

```sql
-- Extended user profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_type TEXT,
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  profile_image_url TEXT,
  language_preference TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_medicine_reminders BOOLEAN DEFAULT true,
  notification_consultation_reminders BOOLEAN DEFAULT true,
  notification_health_alerts BOOLEAN DEFAULT true,
  notification_ble_status BOOLEAN DEFAULT true,
  data_sync_frequency_minutes INTEGER DEFAULT 5,
  emergency_number TEXT DEFAULT '911',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 11.2 BLE Devices

```sql
-- Registered BLE devices
CREATE TABLE ble_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_mac_address TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('bp_monitor', 'heart_rate', 'spo2', 'smartwatch', 'temperature', 'ecg', 'other')),
  device_brand TEXT,
  device_model TEXT,
  is_connected BOOLEAN DEFAULT false,
  battery_level INTEGER,
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_mac_address)
);

-- Health metrics readings
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES ble_devices(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'heart_rate', 'spo2', 'temperature', 'respiration', 'steps', 'ecg', 'glucose', 'weight', 'other')),
  systolic INTEGER, -- For BP
  diastolic INTEGER, -- For BP
  value DECIMAL(10,2), -- For single-value metrics
  unit TEXT, -- 'bpm', '%', '°C', 'mmHg', etc.
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health alerts generated by AI
CREATE TABLE health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
  severity TEXT NOT NULL CHECK (severity IN ('red', 'yellow', 'green')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_metric_ids UUID[], -- Array of health_metrics IDs
  ai_analysis TEXT, -- AI-generated explanation
  recommended_action TEXT,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### 11.3 Consultations

```sql
-- Doctor specialties
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  qualification TEXT,
  experience_years INTEGER,
  hospital_clinic_name TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  profile_image_url TEXT,
  consultation_fee DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations/Appointments
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person', 'online', 'phone')),
  location TEXT, -- For in-person
  meeting_link TEXT, -- For online
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  notes TEXT,
  prescription_id UUID, -- Reference to prescription if generated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);
```

### 11.4 Medical Records

```sql
-- Medical records
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('lab_report', 'prescription', 'discharge_summary', 'xray', 'scan', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- Supabase Storage URL
  file_type TEXT, -- 'pdf', 'image', etc.
  file_size_bytes BIGINT,
  extracted_text TEXT, -- AI-extracted text from OCR
  doctor_name TEXT,
  hospital_clinic_name TEXT,
  record_date DATE,
  tags TEXT[], -- Array of tags for categorization
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.5 Medicines

```sql
-- Medicine catalog (master data)
CREATE TABLE medicine_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  dosage_form TEXT, -- 'tablet', 'capsule', 'syrup', etc.
  strength TEXT, -- '500mg', '10ml', etc.
  description TEXT,
  image_url TEXT,
  is_prescription_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's current medicines
CREATE TABLE user_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  medicine_catalog_id UUID REFERENCES medicine_catalog(id),
  medicine_name TEXT NOT NULL, -- Custom name if not in catalog
  dosage TEXT NOT NULL, -- '1 tablet', '10ml', etc.
  frequency TEXT NOT NULL, -- 'once_daily', 'twice_daily', 'thrice_daily', 'as_needed', 'custom'
  custom_schedule JSONB, -- For complex schedules
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing medicines
  quantity_total INTEGER,
  quantity_remaining INTEGER,
  notes TEXT,
  prescribed_by_doctor_id UUID REFERENCES doctors(id),
  consultation_id UUID REFERENCES consultations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine reminders
CREATE TABLE medicine_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_medicine_id UUID NOT NULL REFERENCES user_medicines(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[], -- [0=Sunday, 1=Monday, ..., 6=Saturday] or NULL for daily
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine intake log
CREATE TABLE medicine_intake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_medicine_id UUID NOT NULL REFERENCES user_medicines(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES medicine_reminders(id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ, -- NULL if missed
  is_taken BOOLEAN DEFAULT false,
  is_missed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine orders
CREATE TABLE medicine_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_address TEXT,
  pharmacy_name TEXT,
  pharmacy_contact TEXT,
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine order items
CREATE TABLE medicine_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES medicine_orders(id) ON DELETE CASCADE,
  medicine_catalog_id UUID REFERENCES medicine_catalog(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.6 AI Assistant

```sql
-- AI chat conversations
CREATE TABLE ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated from first message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat messages
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- For storing action results, context, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.7 Notifications

```sql
-- Notification log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medicine_reminder', 'consultation_reminder', 'health_alert', 'ble_status', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional data for deep linking, etc.
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.8 Emergency Logs

```sql
-- Emergency activation log
CREATE TABLE emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),
  location_address TEXT,
  health_status_snapshot JSONB, -- Current health metrics at time of emergency
  emergency_number_called TEXT,
  caregiver_notified BOOLEAN DEFAULT false,
  caregiver_notification_details JSONB,
  is_false_alarm BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  notes TEXT
);
```

### 11.9 Indexes for Performance

```sql
-- Health metrics indexes
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);

-- Health alerts indexes
CREATE INDEX idx_health_alerts_user_unread ON health_alerts(user_id, is_read) WHERE is_read = false;

-- Consultations indexes
CREATE INDEX idx_consultations_user_status ON consultations(user_id, status);
CREATE INDEX idx_consultations_date ON consultations(appointment_date, appointment_time);

-- Medicine reminders indexes
CREATE INDEX idx_medicine_reminders_active ON medicine_reminders(is_active) WHERE is_active = true;

-- Notifications indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- BLE devices indexes
CREATE INDEX idx_ble_devices_user_active ON ble_devices(user_id, is_active) WHERE is_active = true;
```

### 11.10 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ble_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_intake_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own BLE devices" ON ble_devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health metrics" ON health_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health alerts" ON health_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consultations" ON consultations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own medical records" ON medical_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own medicines" ON user_medicines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reminders" ON medicine_reminders FOR ALL USING (auth.uid() = (SELECT user_id FROM user_medicines WHERE id = user_medicine_id));
CREATE POLICY "Users can manage own intake log" ON medicine_intake_log FOR ALL USING (auth.uid() = (SELECT user_id FROM user_medicines WHERE id = user_medicine_id));
CREATE POLICY "Users can manage own orders" ON medicine_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI conversations" ON ai_chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emergency logs" ON emergency_logs FOR ALL USING (auth.uid() = user_id);

-- Public read access for catalogs
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view specialties" ON specialties FOR SELECT USING (true);
CREATE POLICY "Public can view doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public can view medicine catalog" ON medicine_catalog FOR SELECT USING (true);
```

## 12. Optimal Folder Structure

```
abrazo-health-guardian/
├── .expo/                          # Expo build cache
├── .gitignore
├── app.json                        # Expo configuration
├── package.json
├── tsconfig.json                   # TypeScript configuration
├── babel.config.js                 # Babel configuration
├── metro.config.js                 # Metro bundler config
├── app.config.js                   # Expo app config
│
├── app/                            # Expo Router (file-based routing)
│   ├── (auth)/                     # Auth group (requires no auth)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (tabs)/                     # Main app tabs (requires auth)
│   │   ├── _layout.tsx            # Tab layout
│   │   ├── index.tsx              # Dashboard (home)
│   │   ├── consultations.tsx
│   │   ├── medical-records.tsx
│   │   ├── medicines.tsx
│   │   └── profile.tsx
│   │
│   ├── consultation/               # Consultation nested routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # List consultations
│   │   ├── [id].tsx               # Consultation details
│   │   ├── book.tsx               # Book new consultation
│   │   └── specialties.tsx        # Browse specialties
│   │
│   ├── medical-records/            # Medical records nested routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # List records
│   │   ├── [id].tsx               # Record details
│   │   └── upload.tsx             # Upload new record
│   │
│   ├── medicines/                  # Medicines nested routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Current medicines
│   │   ├── [id].tsx               # Medicine details
│   │   ├── add.tsx                # Add medicine
│   │   ├── reminders.tsx          # Manage reminders
│   │   └── orders.tsx             # Order history
│   │
│   ├── ai-chat/                    # AI chat routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Chat list
│   │   └── [id].tsx               # Chat conversation
│   │
│   ├── settings/                   # Settings routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Settings main
│   │   ├── profile.tsx            # Edit profile
│   │   ├── devices.tsx            # BLE devices
│   │   ├── notifications.tsx      # Notification settings
│   │   └── emergency.tsx          # Emergency contacts
│   │
│   ├── _layout.tsx                # Root layout
│   └── +not-found.tsx             # 404 page
│
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── health/
│   │   │   ├── HealthStatusCard.tsx
│   │   │   ├── HealthMetricDisplay.tsx
│   │   │   ├── HealthAlertCard.tsx
│   │   │   ├── EmergencyButton.tsx
│   │   │   └── HealthChart.tsx
│   │   │
│   │   ├── consultation/
│   │   │   ├── ConsultationCard.tsx
│   │   │   ├── DoctorCard.tsx
│   │   │   ├── SpecialtyCard.tsx
│   │   │   └── AppointmentForm.tsx
│   │   │
│   │   ├── medical-records/
│   │   │   ├── MedicalRecordCard.tsx
│   │   │   ├── RecordViewer.tsx
│   │   │   └── RecordUploader.tsx
│   │   │
│   │   ├── medicines/
│   │   │   ├── MedicineCard.tsx
│   │   │   ├── ReminderCard.tsx
│   │   │   ├── MedicineForm.tsx
│   │   │   └── IntakeLogCard.tsx
│   │   │
│   │   ├── ai-chat/
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatConversation.tsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── DrawerNavigation.tsx
│   │   │   └── TabBar.tsx
│   │   │
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── ScreenContainer.tsx
│   │       └── FloatingActionButton.tsx
│   │
│   ├── screens/                     # Screen components (if needed separately)
│   │   └── (legacy screens if not using file-based routing)
│   │
│   ├── services/                    # Business logic & API services
│   │   ├── api/
│   │   │   ├── supabase.ts         # Supabase client setup
│   │   │   ├── auth.ts             # Authentication service
│   │   │   ├── health.ts           # Health metrics API
│   │   │   ├── consultations.ts    # Consultations API
│   │   │   ├── medicalRecords.ts   # Medical records API
│   │   │   ├── medicines.ts        # Medicines API
│   │   │   ├── aiChat.ts           # AI chat API
│   │   │   └── notifications.ts    # Notifications API
│   │   │
│   │   ├── ble/
│   │   │   ├── bleManager.ts       # BLE connection manager
│   │   │   ├── deviceScanner.ts    # Device discovery
│   │   │   ├── dataParser.ts       # Parse BLE data
│   │   │   └── deviceTypes.ts      # Device type definitions
│   │   │
│   │   ├── ai/
│   │   │   ├── deepseekClient.ts   # DeepSeek API client
│   │   │   ├── healthAnalyzer.ts   # Health data analysis
│   │   │   └── chatHandler.ts      # Chat message handling
│   │   │
│   │   ├── storage/
│   │   │   ├── fileUpload.ts       # File upload to Supabase Storage
│   │   │   └── imagePicker.ts      # Image picker service
│   │   │
│   │   └── notifications/
│   │       ├── localNotifications.ts
│   │       ├── pushNotifications.ts
│   │       └── scheduler.ts        # Notification scheduling
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useHealthMetrics.ts     # Health data hook
│   │   ├── useBLE.ts               # BLE connection hook
│   │   ├── useConsultations.ts     # Consultations hook
│   │   ├── useMedicines.ts         # Medicines hook
│   │   ├── useMedicalRecords.ts    # Medical records hook
│   │   ├── useAIChat.ts            # AI chat hook
│   │   ├── useNotifications.ts     # Notifications hook
│   │   └── useDebounce.ts          # Utility hook
│   │
│   ├── utils/                       # Utility functions
│   │   ├── date.ts                 # Date formatting utilities
│   │   ├── validation.ts           # Form validation
│   │   ├── formatting.ts           # Data formatting
│   │   ├── constants.ts            # App constants
│   │   ├── permissions.ts          # Permission helpers
│   │   └── errors.ts               # Error handling
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── database.ts             # Database types (generated from Supabase)
│   │   ├── health.ts               # Health-related types
│   │   ├── consultation.ts         # Consultation types
│   │   ├── medicine.ts             # Medicine types
│   │   ├── ble.ts                  # BLE device types
│   │   ├── ai.ts                   # AI chat types
│   │   └── navigation.ts           # Navigation types
│   │
│   ├── constants/                   # App-wide constants
│   │   ├── colors.ts               # Color palette
│   │   ├── sizes.ts                # Spacing & sizing
│   │   ├── health.ts               # Health metric thresholds
│   │   └── routes.ts               # Route names
│   │
│   ├── context/                     # React Context providers
│   │   ├── AuthContext.tsx         # Authentication context
│   │   ├── ThemeContext.tsx        # Theme context
│   │   ├── BLEContext.tsx          # BLE connection context
│   │   └── NotificationContext.tsx # Notification context
│   │
│   └── assets/                      # Static assets
│       ├── images/
│       ├── icons/
│       ├── fonts/
│       └── animations/
│
├── supabase/                        # Supabase local development (optional)
│   ├── migrations/                  # Database migrations
│   └── seed.sql                     # Seed data
│
├── __tests__/                       # Test files
│   ├── components/
│   ├── services/
│   └── utils/
│
├── docs/                            # Documentation
│   ├── CONTEXT.md                  # This file
│   ├── API.md                      # API documentation
│   └── DEPLOYMENT.md               # Deployment guide
│
└── README.md                        # Project README
```

### 12.1 Key Configuration Files

**package.json** dependencies (key packages):
```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.0.0",
    "react-native": "0.73.0",
    "react-native-paper": "^5.11.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-native-ble-plx": "^3.0.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "expo-notifications": "~0.26.0",
    "expo-location": "~16.5.0",
    "expo-document-picker": "~11.10.0",
    "expo-image-picker": "~14.7.0",
    "date-fns": "^2.30.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-vector-icons": "^10.0.0"
  }
}
```

### 12.2 Environment Variables

Create `.env` file (add to `.gitignore`):
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
EXPO_PUBLIC_EMERGENCY_NUMBER=911
```

## 13. Step-by-Step Implementation Plan

1. **Environment & Tooling Setup**
   - Install Expo CLI, configure Node 18+, and run `expo doctor` to verify.
   - Create `.env` with Supabase + DeepSeek keys; hook into `expo-secure-store` for runtime access.
   - Initialize Supabase project; run schema migrations in `supabase/migrations`.

2. **Project Scaffolding**
   - Bootstrap Expo Router structure from Section 12.
   - Configure TypeScript, ESLint, Prettier, Husky pre-commit hooks.
   - Wire React Native Paper theme + custom color tokens.

3. **Authentication Flow**
   - Implement Supabase auth (email/password, OTP) within `AuthContext`.
   - Build `(auth)/login`, `signup`, `forgot-password` screens.
   - Add protected route guard to `(tabs)` layout; store session in `AsyncStorage`.

4. **User Profile & Settings**
   - Create profile screen + edit form backed by `user_profiles` + `user_settings`.
   - Build emergency contact editor and theme/language toggles.
   - Sync settings to Supabase with optimistic UI + offline cache.

5. **BLE Connectivity Layer**
   - Implement `bleManager` with `react-native-ble-plx`; handle permissions.
   - Build device scan/pair UI (`settings/devices`).
   - Normalize device data via `dataParser`, push to Supabase `health_metrics`.

6. **Dashboard Health Status**
   - Create health cards, trend charts, last-sync indicator.
   - Consume `useHealthMetrics` hook with pagination + caching.
   - Display AI alert summary + emergency button + FAB chat trigger.

7. **Health Alerts & AI Analytics**
   - Implement server-side scheduled job (Supabase Edge Function) running `healthAnalyzer`.
   - Store alerts in `health_alerts`; fetch + filter by severity in app.
   - Add alert detail modal with recommended actions + resolution workflow.

8. **Consultation Module**
   - Build list/create/cancel flows using `consultations` API service.
   - Implement doctor & specialty browsing, slot picker, and reminder scheduling.
   - Integrate with notifications for 24h + 1h reminders.

9. **Medical Records**
   - Enable file uploads via `expo-document-picker` + Supabase Storage.
   - Show record cards, previewer, and AI OCR extraction summary.
   - Add tagging/search + offline metadata cache.

10. **Medicines & Reminders**
    - CRUD for user medicines, schedule editor, and reminder list.
    - Local + push notifications using `expo-notifications` scheduler.
    - Intake logging UI with adherence stats; tie to AI insights.

11. **AI Chat Assistant**
    - Implement chat UI, conversation history, DeepSeek integration.
    - Allow tool-calling for booking consults, ordering meds, summarizing metrics.
    - Provide first-aid templates + safety guardrails for emergency advice.

12. **Emergency Workflow**
    - Wire red emergency button to call/SMS; capture location via `expo-location`.
    - Generate health snapshot from latest metrics; log in `emergency_logs`.
    - Add caregiver contact management + confirmation prompts.

13. **Notifications & Background Tasks**
    - Configure push tokens, Supabase Edge functions for server push.
    - Implement background fetch for BLE sync + reminder checks (Expo Task Manager).
    - Centralize notification preferences in `NotificationContext`.

14. **Testing & Quality**
    - Write unit tests (`__tests__`) for hooks/services; use Jest + React Native Testing Library.
    - Add detox/E2E smoke tests for auth + dashboard.
    - Monitor with Expo Application Services + Supabase logs.

15. **Deployment & Monitoring**
    - Prepare Expo EAS build profiles (dev, preview, production).
    - Automate migrations + environment promotion scripts.
    - Document release checklist in `docs/DEPLOYMENT.md`.