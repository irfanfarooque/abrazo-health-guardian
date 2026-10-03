import type { Device } from 'react-native-ble-plx';

export type BLEDeviceType =
  | 'bp_monitor'
  | 'heart_rate'
  | 'spo2'
  | 'smartwatch'
  | 'temperature'
  | 'ecg'
  | 'other';

export interface BLEDeviceRecord {
  id: string;
  user_id: string;
  device_name: string;
  device_mac_address: string;
  device_type: BLEDeviceType;
  device_brand: string | null;
  device_model: string | null;
  is_connected: boolean;
  battery_level: number | null;
  last_connected_at: string | null;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScannedBLEDevice {
  id: string;
  name: string | null;
  localName: string | null;
  rssi: number;
  isConnectable: boolean | null;
  serviceUUIDs: string[] | null;
  manufacturerData: string | null;
  device: Device;
}

export interface ParsedHealthData {
  metric_type: 'blood_pressure' | 'heart_rate' | 'spo2' | 'temperature' | 'respiration' | 'steps' | 'ecg' | 'glucose' | 'weight';
  systolic?: number;
  diastolic?: number;
  value?: number;
  unit?: string;
  notes?: string;
}

export interface BLEServiceUUIDs {
  heartRate: string;
  bloodPressure: string;
  healthThermometer: string;
  pulseOximeter: string;
  deviceInformation: string;
  battery: string;
}

export const BLE_SERVICE_UUIDS: BLEServiceUUIDs = {
  heartRate: '0000180d-0000-1000-8000-00805f9b34fb',
  bloodPressure: '00001810-0000-1000-8000-00805f9b34fb',
  healthThermometer: '00001809-0000-1000-8000-00805f9b34fb',
  pulseOximeter: '00001822-0000-1000-8000-00805f9b34fb',
  deviceInformation: '0000180a-0000-1000-8000-00805f9b34fb',
  battery: '0000180f-0000-1000-8000-00805f9b34fb',
};

