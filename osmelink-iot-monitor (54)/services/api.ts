
import { Vehicle, Customer } from '../types';

// In production, we use a relative path so the Vercel proxy handles routing
// In development, we fall back to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const fetchSafely = async (endpoint: string, options?: RequestInit) => {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
    return res.ok ? await res.json() : null;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return null;
  }
};

export const apiService = {
  login: async (creds: any) => fetchSafely('/login', { method: 'POST', body: JSON.stringify(creds) }),
  getAllVehicles: async (): Promise<Vehicle[]> => (await fetchSafely('/vehicles')) || [],
  getVehicleDetails: async (id: string): Promise<Vehicle | null> => fetchSafely(`/telemetry/${id}`),
  updateVehicle: async (id: string, body: any) => fetchSafely(`/telemetry/${id}`, { method: 'POST', body: JSON.stringify(body) }),
  getCustomers: async () => (await fetchSafely('/customers')) || [],
  getUsers: async () => (await fetchSafely('/users')) || [],
  saveCustomer: async (body: any) => fetchSafely('/customers', { method: 'POST', body: JSON.stringify(body) }),
  saveUser: async (body: any) => fetchSafely('/users', { method: 'POST', body: JSON.stringify(body) }),
  saveDealer: async (body: any) => fetchSafely('/dealers', { method: 'POST', body: JSON.stringify(body) }),
  getDealers: async () => (await fetchSafely('/dealers')) || [],
  getConnectionStatus: () => true // Basic status check
};
