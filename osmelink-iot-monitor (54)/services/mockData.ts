
import { Vehicle, VehicleStatus, VehicleLog } from '../types';

// Centers around India
const INDIA_BOUNDS = {
  latMin: 8.4,
  latMax: 37.6,
  lngMin: 68.7,
  lngMax: 97.25,
};

const CITIES = [
  { name: 'Delhi', lat: 28.61, lng: 77.23 },
  { name: 'Mumbai', lat: 19.07, lng: 72.87 },
  { name: 'Bangalore', lat: 12.97, lng: 77.59 },
  { name: 'Chennai', lat: 13.08, lng: 80.27 },
  { name: 'Hyderabad', lat: 17.38, lng: 78.48 },
  { name: 'Kolkata', lat: 22.57, lng: 88.36 },
];

const generateRandomCoordinate = (centerLat: number, centerLng: number, radiusDeg: number = 0.5) => {
  const u = Math.random();
  const v = Math.random();
  const w = radiusDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: centerLat + x,
    lng: centerLng + y,
  };
};

export const generateVehicles = (count: number): Vehicle[] => {
  return Array.from({ length: count }).map((_, index) => {
    const useCity = Math.random() > 0.2;
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const location = useCity 
      ? generateRandomCoordinate(city.lat, city.lng)
      : {
          lat: INDIA_BOUNDS.latMin + Math.random() * (INDIA_BOUNDS.latMax - INDIA_BOUNDS.latMin),
          lng: INDIA_BOUNDS.lngMin + Math.random() * (INDIA_BOUNDS.lngMax - INDIA_BOUNDS.lngMin),
        };

    const isIgnitionOn = Math.random() > 0.4;
    const speed = isIgnitionOn ? Math.floor(Math.random() * 80) : 0;
    
    let status = VehicleStatus.OFFLINE;
    if (isIgnitionOn && speed > 0) {
      status = VehicleStatus.ONLINE;
    } else if (isIgnitionOn && speed === 0) {
      status = VehicleStatus.IDLE;
    } else {
      status = Math.random() > 0.5 ? VehicleStatus.OFFLINE : VehicleStatus.IDLE;
    }

    const hwId = `VEH-${1000 + index}`;
    // Fixed: Added missing registrationNo property required by Vehicle interface
    return {
      id: hwId,
      displayDeviceId: `OM-${100000 + index}`,
      imei: hwId,
      chassisNumber: `CH-${Math.random().toString(36).substring(7).toUpperCase()}`,
      registrationNo: `REG-${1000 + index}`,
      deviceId: `DEV-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status,
      location,
      lastUpdate: new Date().toISOString(),
      metrics: {
        co2Saved: Math.floor(Math.random() * 5000),
        totalKm: Math.floor(Math.random() * 50000),
        batteryLevel: Math.floor(Math.random() * 100),
        speed,
        ignition: isIgnitionOn,
      },
      subscriptionActive: Math.random() > 0.1, // 90% active
    };
  });
};

export const MOCK_VEHICLES = generateVehicles(50);

export const generateVehicleLogs = (vehicleId: string, count: number = 50): VehicleLog[] => {
  const logs: VehicleLog[] = [];
  const now = new Date();
  
  // Base values
  let currentOdometer = 12500;
  let currentSoc = 85;
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - i * 15 * 60000); // Every 15 mins back
    
    // Randomize state slightly
    const speed = Math.random() > 0.3 ? Math.floor(Math.random() * 60) + 20 : 0;
    let status = VehicleStatus.OFFLINE;
    if (speed > 0) status = VehicleStatus.ONLINE;
    else if (Math.random() > 0.5) status = VehicleStatus.IDLE;
    
    const isCharging = status !== VehicleStatus.ONLINE && Math.random() > 0.7;
    
    // Physics simulation
    if (status === VehicleStatus.ONLINE) {
      currentOdometer -= (speed * 0.25); // reverse logic since we go backwards in time
      currentSoc += (speed * 0.05); // SOC was higher in the past (draining now)
    } else if (isCharging) {
      currentSoc -= 5; // SOC was lower in the past (charging now)
    }
    
    // Clamp SOC
    currentSoc = Math.max(0, Math.min(100, currentSoc));
    
    logs.push({
      id: `LOG-${time.getTime()}`,
      timestamp: time.toISOString(),
      status: i === 0 ? VehicleStatus.ONLINE : (isCharging ? VehicleStatus.IDLE : status as string),
      voltage: 350 + Math.random() * 50, // 350-400V
      current: isCharging ? -30 - Math.random() * 20 : (speed > 0 ? 20 + Math.random() * 100 : 0.5),
      temp: 30 + Math.random() * 15,
      speed: isCharging ? 0 : speed,
      soc: Math.floor(currentSoc),
      odometer: Math.floor(currentOdometer),
      isCharging: isCharging,
      dtc: Math.random() > 0.95 ? 'P0A1F' : undefined // Occasional error code
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};