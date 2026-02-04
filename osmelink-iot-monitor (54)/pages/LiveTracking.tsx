
import React, { useState, useEffect, useMemo, useContext } from 'react';
import VehicleMap from '../components/Map/VehicleMap';
import { apiService } from '../services/api';
import { Vehicle, VehicleStatus } from '../types';
import { Search, Loader2, Battery, Gauge, Info, ChevronRight, Navigation, X } from 'lucide-react';
import { AuthContext } from '../App';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

const LiveTracking: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await apiService.getAllVehicles();
        let filtered = data || [];
        if (user?.role === 'Customer') {
          filtered = filtered.filter(v => v.equipmentConfig?.customerCode === user.customerCode);
        } else if (user?.role === 'User') {
          const assigned = user.assignedVehicles || [];
          filtered = filtered.filter(v => assigned.includes(v.id));
        }
        setVehicles(filtered);
      } catch (err) {
        console.error("Tracking Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
    const timer = setInterval(fetchVehicles, 10000);
    return () => clearInterval(timer);
  }, [user]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      (v.chassisNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.displayDeviceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.registrationNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vehicles, searchQuery]);

  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId), 
  [vehicles, selectedVehicleId]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'on' || s === 'online') return 'bg-emerald-500 animate-pulse';
    if (s === 'idle') return 'bg-amber-500';
    if (s === 'off' || s === 'offline') return 'bg-rose-500';
    return 'bg-slate-300';
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-white font-sans">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Syncing Live Network...</p>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden font-sans">
      <aside className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search VIN / Chassis..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No assets found</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => {
              const isActive = selectedVehicleId === vehicle.id;
              return (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isActive 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                        VIN: {vehicle.chassisNumber || vehicle.displayDeviceId || '---'}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">{vehicle.registrationNo || 'No Reg'}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(vehicle.status as string)}`}></div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Battery size={12} className={vehicle.metrics.batteryLevel < 20 ? 'text-rose-500' : 'text-slate-400'} />
                      <span className="text-xs font-mono font-bold">{vehicle.metrics.batteryLevel?.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Gauge size={12} className="text-slate-400" />
                      <span className="text-xs font-mono font-bold">{vehicle.metrics.speed?.toFixed(0)} <span className="text-[10px] font-sans font-medium">km/h</span></span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className="flex-1 relative bg-slate-50">
        <VehicleMap 
          vehicles={filteredVehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={setSelectedVehicleId}
        />

        {selectedVehicle && (
          <div className="absolute top-6 right-6 w-80 bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden z-[40] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-slate-900 p-6 text-white relative">
              <button 
                onClick={() => setSelectedVehicleId(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-1"
                aria-label="Close vehicle details"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-2 pr-8">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Navigation size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest truncate">
                  {selectedVehicle.displayDeviceId || 'Unit Profile'}
                </h3>
              </div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest truncate">
                Hardware ID: {selectedVehicle.id}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Battery</span>
                  <span className="text-xl font-black font-mono text-slate-800">{selectedVehicle.metrics.batteryLevel?.toFixed(0)}%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Speed</span>
                  <span className="text-xl font-black font-mono text-slate-800">{selectedVehicle.metrics.speed?.toFixed(0)}<span className="text-xs ml-0.5">km/h</span></span>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">VIN / Chassis</span>
                    <span className="text-[11px] font-bold text-slate-800 font-mono">{selectedVehicle.chassisNumber || '---'}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Current Status</span>
                    <span className={`text-[11px] font-bold uppercase ${selectedVehicle.status === 'On' ? 'text-emerald-600' : selectedVehicle.status === 'Idle' ? 'text-amber-500' : 'text-rose-500'}`}>
                      {selectedVehicle.status || 'Offline'}
                    </span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Last Seen</span>
                    <span className="text-[11px] font-bold text-slate-800">{new Date(selectedVehicle.lastUpdate).toLocaleTimeString()}</span>
                 </div>
              </div>

              <button 
                onClick={() => navigate(`/raw-data?id=${selectedVehicle.id}&tab=download`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
              >
                <Info size={14} />
                Access Full Telemetry
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveTracking;
