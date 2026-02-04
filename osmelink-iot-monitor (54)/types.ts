
export enum VehicleStatus {
  ONLINE = 'On',
  OFFLINE = 'Off',
  IDLE = 'Idle',
  CHARGING = 'Charging',
  ON_CHARGE = 'On Charge',
  NON_COMMUNICATING = 'Non-Communicating',
  SERVICE = 'Service',
  GEOFENCE = 'Geofence',
  IMMOBILIZED = 'Immobilized',
}

// Added Customer interface to resolve import error in api.ts and Admin.tsx
export interface Customer {
  id: string; // Internal UUID
  customerCode: string;
  customerName: string;
  phoneNo: string;
  whatsappNo: string;
  emailId: string;
  // Renamed from invoiceDate to onboardDate to match usage in Admin.tsx and src/types.ts
  onboardDate: string;
  address: string;
  city: string;
  state: string;
  country: string;
  manufacturingYear: string;
  timezoneName: string;
  parentPositionName: string;
  dealerCode: string;
  isUser: boolean;
  username?: string;
  password?: string;
}

// Strictly aligned with GetVehicleDetails JSON
export interface EquipmentConfig {
  equipmentCode: string;
  hardwareId: string;
  description: string;
  siteName: string;
  siteCode: string;
  dealerName: string;
  customerCode: string;
  customerName?: string;
  subCategoryName: string;
  hierarchyName: string;
  batterySerialNo: string;
  latitude: number;
  longitude: number;
  modelCode: string;
  vehicleRegNo: string;
  invoiceDate: string;
  manufacturingYear: number | string;
  vehicleChassisNo: string;
  batteryTypeName: string;
  bmsTypeName: string;
  active: boolean;
  geoFence: boolean;
  location: string;
  vehicleStatus: string;
  activeSubscription?: string;
}

export interface VehicleAnalytics {
  avgEfficiency: number;
  dailyDistance: number;
  safetyScore: number;
  idleTimeMinutes: number;
  chargeCycles: number;
  healthSoh: number;
  harshBrakingCount: number;
}

// Added VehicleLog interface to resolve import error in mockData.ts
export interface VehicleLog {
  id: string;
  timestamp: string;
  status: string;
  voltage: number;
  current: number;
  temp: number;
  speed: number;
  soc: number;
  odometer: number;
  isCharging: boolean;
  dtc?: string;
  ENTRYDATE?: string;
  DeviceDate?: string;
  HWID?: string;
}

export interface Vehicle {
  id: string; // Hardware ID
  displayDeviceId: string; // Equipment Code
  imei: string;
  chassisNumber: string;
  registrationNo: string;
  deviceId: string;
  status: VehicleStatus | string;
  location: {
    lat: number;
    lng: number;
  };
  lastUpdate: string;
  
  vehicleModel?: string;
  mfgYear?: string;
  // Added ownerName to resolve TypeScript error in Report page
  ownerName?: string;
  
  equipmentConfig?: EquipmentConfig;
  analytics?: VehicleAnalytics;

  metrics: Record<string, any> & {
    batteryLevel: number;
    speed: number;
    ignition: boolean;
    voltage?: number;
    current?: number;
    temp?: number;
    totalKm?: number;
    co2Saved?: number;
    motorTemp?: number;
    rssi?: number;
  };
  history?: any[];
}

export interface FleetStats {
  totalCo2Saved: number;
  totalKm: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
  onlineCount: number;
  offlineCount: number;
  idleCount: number;
  nonCommunicatingCount: number;
  totalCount: number;
}
