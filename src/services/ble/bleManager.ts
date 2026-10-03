import { BleManager, Device, State as BleState } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import type { ScannedBLEDevice, BLEDeviceType, ParsedHealthData } from '@/types/ble';
import { BLE_SERVICE_UUIDS } from '@/types/ble';

export class BLEManagerService {
  private manager: BleManager | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (typeof BleManager !== 'undefined') {
        this.manager = new BleManager();
        this.isInitialized = true;
      } else {
        console.warn('[BLE] BleManager not available - BLE disabled');
        this.manager = null;
      }
    } catch (error) {
      console.warn('[BLE] Initialization failed (expected on emulator):', error);
      this.manager = null;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && Boolean(this.manager);
  }

  private setupStateListener() {
    if (!this.manager) return;

    this.manager.onStateChange((state) => {
      console.log('[BLE] State changed:', state);
      if (state === BleState.PoweredOff) {
        console.warn('[BLE] Bluetooth is powered off');
      }
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions automatically
  }

  async checkBluetoothState(): Promise<BleState> {
    if (!this.manager) {
      throw new Error('BLE Manager not initialized');
    }
    return this.manager.state();
  }

  async startScanning(
    onDeviceFound: (device: ScannedBLEDevice) => void,
    filterByServiceUUIDs?: string[],
  ): Promise<void> {
    if (!this.manager) {
      console.warn('[BLE] Not available, skipping scan');
      return;
    }

    if (this.isScanning) {
      console.warn('[BLE] Already scanning');
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.checkBluetoothState();
    if (state !== BleState.PoweredOn) {
      throw new Error(`Bluetooth is not powered on. Current state: ${state}`);
    }

    this.isScanning = true;

    this.manager.startDeviceScan(filterByServiceUUIDs || null, null, (error, device) => {
      if (error) {
        console.error('[BLE] Scan error:', error);
        this.isScanning = false;
        return;
      }

      if (device) {
        onDeviceFound({
          id: device.id,
          name: device.name,
          localName: device.localName,
          rssi: device.rssi || 0,
          isConnectable: device.isConnectable,
          serviceUUIDs: device.serviceUUIDs || null,
          manufacturerData: device.manufacturerData || null,
          device,
        });
      }
    });
  }

  async stopScanning(): Promise<void> {
    if (!this.manager) return;

    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    if (!this.manager) {
      throw new Error('BLE Manager not initialized');
    }

    if (this.connectedDevices.has(deviceId)) {
      return this.connectedDevices.get(deviceId)!;
    }

    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    this.connectedDevices.set(deviceId, device);

    device.onDisconnected((error, disconnectedDevice) => {
      console.log('[BLE] Device disconnected:', disconnectedDevice.id, error);
      this.connectedDevices.delete(disconnectedDevice.id);
    });

    return device;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    if (!this.manager) return;

    const device = this.connectedDevices.get(deviceId);
    if (device) {
      await device.cancelConnection();
      this.connectedDevices.delete(deviceId);
    }
  }

  async readCharacteristic(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<string | null> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error('Device not connected');
    }

    const characteristic = await device.readCharacteristicForService(serviceUUID, characteristicUUID);
    return characteristic.value || null;
  }

  async monitorCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (value: string | null) => void,
  ): Promise<() => void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error('Device not connected');
    }

    const subscription = device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
      if (error) {
        console.error('[BLE] Monitor error:', error);
        return;
      }
      callback(characteristic?.value || null);
    });

    return () => {
      subscription.remove();
    };
  }

  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async getBatteryLevel(deviceId: string): Promise<number | null> {
    try {
      const value = await this.readCharacteristic(deviceId, BLE_SERVICE_UUIDS.battery, '00002a19-0000-1000-8000-00805f9b34fb');
      if (value) {
        // Battery level is typically a single byte (0-100)
        // Convert base64 to Uint8Array
        const binaryString = atob(value);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes[0] || null;
      }
    } catch (error) {
      console.warn('[BLE] Failed to read battery level:', error);
    }
    return null;
  }

  destroy() {
    this.stopScanning();
    this.connectedDevices.forEach((device) => {
      device.cancelConnection().catch(console.error);
    });
    this.connectedDevices.clear();
    this.manager?.destroy();
    this.manager = null;
  }
}

export const bleManager = new BLEManagerService();

